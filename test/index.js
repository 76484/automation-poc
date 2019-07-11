const axios = require('axios');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
    Builder,
    By,
    until
} = require('selenium-webdriver');
const { forEachSeries } = require('p-iteration');

const MOUNTEBANK_URL = "http://localhost:2525"
const IMPOSTER_PORT = 4545;

const LOCATIONS = {
    CHICAGO: {
        "city": "Chicago",
        "subdivision_code": "IL"
    },
    MONTREAL: {
        "city": "Montreal",
        "subdivision_code": "QC"
    },
    TORONTO: {
        "city": "Toronto",
        "subdivision_code": "ON"
    },
    VANCOUVER: {
        "city": "Vancouver",
        "subdivision_code": "BC"
    }
};

const PARTNERS = {
    A: {
        hasDefaultAllInPricing: true,
        url: "http://localhost:3000"
    },
    B: {
        hasDefaultAllInPricing: false,
        url: "http://localhost:3001"
    }
};

const LOCATORS = {
    HAS_ALL_IN_PRICING: By.id('HasAllInPricing'),
    LOCATION: By.id('Location')
};

const createImposter = () => {
    return axios
        .delete(`${MOUNTEBANK_URL}/imposters`)
        .then(() => {
            return axios.post(`${MOUNTEBANK_URL}/imposters`, {
                "port": IMPOSTER_PORT,
                "protocol": "http"
            });
        });
};

const createLocationsStub = (locations, wait) => {
    const behaviors = {};

    if (wait) {
        behaviors.wait = wait;
    }

    return axios.put(`${MOUNTEBANK_URL}/imposters/${IMPOSTER_PORT}/stubs`, {
        "stubs": [
            {
                "predicates": [
                    {
                        "equals": {
                            "path": "/v2/locations",
                            "method": "GET"
                        }
                    }
                ],
                "responses": locations.map(location => {
                    return {
                        "is": {
                            "statusCode": 200,
                            "headers": {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "application/json"
                            },
                            "body": {
                                location,
                                "success": true
                            }
                        },
                        "_behaviors": behaviors
                    }
                })
            }
        ]
    });
};

const createImposterPromise = createImposter();

const createDriver = () => {
    return new Promise(resolve => {
        new Builder()
            .forBrowser('chrome')
            .build()
            .then(driver => resolve(driver));
    });
};

chai.use(chaiAsPromised);
const expect = chai.expect;

const PARTNER = PARTNERS.A; // TODO: This must be a run-time arg.

const getElementText = async locator => {
    const driver = await createDriver();

    try {
        await driver.get(PARTNER.url);

        const el = await driver.wait(
            until.elementLocated(locator, 10 * 1000)
        );

        return await driver.wait(() => el.getText(), 10 * 1000);
    } finally {
        driver.quit();
    }
};

describe('Location', function () {
    beforeEach(async function () {
        return await createImposterPromise
    });

    it('should be set with city and subdivision code from Location response', async function () {
        const locations = [
            LOCATIONS.CHICAGO,
            LOCATIONS.TORONTO,
            LOCATIONS.VANCOUVER
        ]

        await forEachSeries(locations, async location => {
            await createLocationsStub([location]);
            await expect(getElementText(LOCATORS.LOCATION)).to.eventually.equal(`${location.city}, ${location.subdivision_code}`);
        });
    });

    it('should render "Timedout" if Location request exceeds 3 second timeout', async function () {
        await createLocationsStub([LOCATIONS.TORONTO], 5 * 1000);
        await expect(getElementText(LOCATORS.LOCATION)).to.eventually.equal('Timedout');
    });

    context('when Partner has default to All-In Pricing', function () {
        if (PARTNER.hasDefaultAllInPricing) {
            it('should have All-In Pricing be "Yes" when location\'s subdivision_code is "ON" or "QC"', async function () {
                const locationsWithAllInPricing = [
                    LOCATIONS.MONTREAL,
                    LOCATIONS.TORONTO
                ]

                await createLocationsStub(locationsWithAllInPricing);
                await forEachSeries(locationsWithAllInPricing, async () => {
                    await expect(getElementText(LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('Yes');
                });
            });

            it('should have All-In Pricing be "No" when location\'s subdivision_code is not "ON" or "QC"', async function () {
                const locationsWithoutAllInPricing = [
                    LOCATIONS.CHICAGO,
                    LOCATIONS.VANCOUVER
                ]

                await createLocationsStub(locationsWithoutAllInPricing);
                await forEachSeries(locationsWithoutAllInPricing, async () => {
                    await expect(getElementText(LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('No');
                });
            });
        }
    });

    context('when Partner does not have default to All-In Pricing', function () {
        if (!PARTNER.hasDefaultAllInPricing) {
            it('should have All-In Pricing be "No" regardless of location\'s subdivision_code', async function () {
                const locations = [
                    LOCATIONS.CHICAGO,
                    LOCATIONS.MONTREAL,
                    LOCATIONS.TORONTO,
                    LOCATIONS.VANCOUVER
                ]

                await forEachSeries(locations, async location => {
                    await createLocationsStub([location]);
                    await expect(getElementText(LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('No');
                });
            });
        }
    });
});
