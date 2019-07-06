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
}

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

const createLocationsStub = locations => {
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
                        }
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

const getHasAllInPricingText = async location => {
    const driver = await createDriver();

    try {
        await driver.get('http://localhost:3000');

        const el = await driver.wait(
            until.elementLocated(By.id('HasAllInPricing'), 10 * 1000)
        );

        return await driver.wait(() => el.getText(), 10 * 1000);
    } finally {
        driver.quit();
    }
};

describe('Location', () => {
    beforeEach(async () => {
        return await createImposterPromise
    });

    it('should be set with city and subdivision code from Location response', () => {
        const testLocationText = location => {
            return createLocationsStub([location])
                .then(() => createDriver())
                .then(driver => {
                    return driver
                        .get('http://localhost:3000')
                        .then(() => {
                            return driver.wait(
                                until.elementLocated(By.id('Location'), 10 * 1000)
                            );
                        })
                        .then(el => {
                            return driver.wait(() => el.getText(), 10 * 1000);
                        })
                        .then(text => {
                            return expect(text).to.equal(`${location.city}, ${location.subdivision_code}`);
                        })
                        .finally(() => {
                            driver.quit();
                        });
                });
        };

        return createImposterPromise
            .then(() => testLocationText(LOCATIONS.TORONTO))
            .then(() => testLocationText(LOCATIONS.VANCOUVER))
            .then(() => testLocationText(LOCATIONS.CHICAGO))
        ;
    });

    it('should have All-In Pricing be "Yes" when location\'s subdivision_code is "ON" or "QC"', async () => {
        const locationsWithAllInPricing = [
            LOCATIONS.MONTREAL,
            LOCATIONS.TORONTO
        ]

        await createLocationsStub(locationsWithAllInPricing);
        await forEachSeries(locationsWithAllInPricing, async location => {
            await expect(getHasAllInPricingText(location)).to.eventually.equal('Yes');
        });
    });

    it('should have All-In Pricing be "No" when location\'s subdivision_code is not "ON" or "QC"', async () => {
        const locationsWithoutAllInPricing = [
            LOCATIONS.CHICAGO,
            LOCATIONS.VANCOUVER
        ]

        await createLocationsStub(locationsWithoutAllInPricing);
        await forEachSeries(locationsWithoutAllInPricing, async location => {
            await expect(getHasAllInPricingText(location)).to.eventually.equal('No');
        });
    });
});
