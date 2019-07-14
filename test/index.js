const axios = require('axios');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
    Builder,
    By,
    until
} = require('selenium-webdriver');
const { forEachSeries } = require('p-iteration');

const {
    CORS_STUB,
    makeLocationStub,
    makeSsoAuthStub
} = require('./services/stubService');

const MOUNTEBANK_URL = "http://localhost:2525"
const IMPOSTER_PORT = 4545;

const PARTNERS = {
    A: {
        partnerId: "A",
        hasDefaultAllInPricing: true,
        url: "http://localhost:3000"
    },
    B: {
        partnerId: "B",
        hasDefaultAllInPricing: false,
        url: "http://localhost:3001"
    }
};

const ACCOUNTS = {
    [PARTNERS.A.partnerId]: {
        id: 1,
        email_address: "aaron.test@vividseats.com",
        first_name: "Aaron"
    },
    [PARTNERS.B.partnerId]: {
        id: 2,
        email_address: "bob.test@vividseats.com",
        first_name: "Bob"
    }
};

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

const LOCATORS = {
    HAS_ALL_IN_PRICING: By.id('HasAllInPricing'),
    LOCATION: By.id('Location')
};

const createImposter = async () => {
    await axios.delete(`${MOUNTEBANK_URL}/imposters/${IMPOSTER_PORT}`);
    return axios.post(`${MOUNTEBANK_URL}/imposters`, {
        port: IMPOSTER_PORT,
        protocol: "http"
    });
};

const setStubs = stubs => {
    return axios.put(`${MOUNTEBANK_URL}/imposters/${IMPOSTER_PORT}/stubs`, { stubs });
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

const PARTNER = PARTNERS.B; // TODO: This must be a run-time arg.

const getElementText = async (authToken, locator) => {
    const driver = await createDriver();

    try {
        await driver.get(`${PARTNER.url}?token=${authToken}`);

        const el = await driver.wait(
            until.elementLocated(locator, 10 * 1000)
        );

        return await driver.wait(() => el.getText(), 10 * 1000);
    } finally {
        driver.quit();
    }
};

describe('Location', function () {
    const account = ACCOUNTS[PARTNER.partnerId];
    const authToken = `${PARTNER.partnerId}-${account.id}`;

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
            await setStubs([
                CORS_STUB,
                makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                makeLocationStub(PARTNER.partnerId, [location])
            ]);
            await expect(getElementText(authToken, LOCATORS.LOCATION)).to.eventually.equal(`${location.city}, ${location.subdivision_code}`);
        });
    });

    it('should render "Timedout" if Location request exceeds 3 second timeout', async function () {
        await setStubs([
            CORS_STUB,
            makeSsoAuthStub(PARTNER.partnerId, authToken, account),
            makeLocationStub(PARTNER.partnerId, [LOCATIONS.TORONTO], 5 * 1000)
        ]);
        await expect(getElementText(authToken, LOCATORS.LOCATION)).to.eventually.equal('Timedout');
    });

    context('when Partner has default to All-In Pricing', function () {
        if (PARTNER.hasDefaultAllInPricing) {
            it('should have All-In Pricing be "Yes" when location\'s subdivision_code is "ON" or "QC"', async function () {
                const locationsWithAllInPricing = [
                    LOCATIONS.MONTREAL,
                    LOCATIONS.TORONTO
                ]

                await setStubs([
                    CORS_STUB,
                    makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                    makeLocationStub(PARTNER.partnerId, locationsWithAllInPricing)
                ]);
                await forEachSeries(locationsWithAllInPricing, async () => {
                    await expect(getElementText(authToken, LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('Yes');
                });
            });

            it('should have All-In Pricing be "No" when location\'s subdivision_code is not "ON" or "QC"', async function () {
                const locationsWithoutAllInPricing = [
                    LOCATIONS.CHICAGO,
                    LOCATIONS.VANCOUVER
                ]

                await setStubs([
                    CORS_STUB,
                    makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                    makeLocationStub(PARTNER.partnerId, locationsWithoutAllInPricing)
                ])
                await forEachSeries(locationsWithoutAllInPricing, async () => {
                    await expect(getElementText(authToken, LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('No');
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
                    await setStubs([
                        CORS_STUB,
                        makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                        makeLocationStub(PARTNER.partnerId, [location])
                    ]);
                    await expect(getElementText(authToken, LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('No');
                });
            });
        }
    });
});
