const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { forEachSeries } = require('p-iteration');

const {
    CORS_STUB,
    makeLocationStub,
    makeSsoAuthStub
} = require('./services/stubService');

const {
    ACCOUNTS,
    LOCATIONS,
    PARTNERS
} = require('./data');

const {
    createImposter,
    setStubs
} = require('./mockApiGateway');

const {
    LOCATORS,
    getElementText
} = require('./driver');


const expect = chai.expect;

const PARTNER = PARTNERS.A; // TODO: This must be a run-time arg.

const createImposterPromise = createImposter();

chai.use(chaiAsPromised);

describe('Location', function () {
    const account = ACCOUNTS[PARTNER.partnerId];
    const authToken = `${PARTNER.partnerId}-${account.id}`;
    const url = `${PARTNER.url}?token=${authToken}`;

    beforeEach(async function () {
        return await createImposterPromise;
    });

    it('should be set with city and subdivision code from Location response', async function () {
        const locations = [
            LOCATIONS.CHICAGO,
            LOCATIONS.TORONTO,
            LOCATIONS.VANCOUVER
        ];

        await forEachSeries(locations, async location => {
            await setStubs([
                CORS_STUB,
                makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                makeLocationStub(PARTNER.partnerId, [location])
            ]);
            await expect(getElementText(url, LOCATORS.LOCATION)).to.eventually.equal(`${location.city}, ${location.subdivision_code}`);
        });
    });

    it('should render "Timedout" if Location request exceeds 3 second timeout', async function () {
        await setStubs([
            CORS_STUB,
            makeSsoAuthStub(PARTNER.partnerId, authToken, account),
            makeLocationStub(PARTNER.partnerId, [LOCATIONS.TORONTO], 5 * 1000)
        ]);
        await expect(getElementText(url, LOCATORS.LOCATION)).to.eventually.equal('Timedout');
    });

    context('when Partner has default to All-In Pricing', function () {
        if (PARTNER.hasDefaultAllInPricing) {
            it('should have All-In Pricing be "Yes" when location\'s subdivision_code is "ON" or "QC"', async function () {
                const locationsWithAllInPricing = [
                    LOCATIONS.MONTREAL,
                    LOCATIONS.TORONTO
                ];

                await setStubs([
                    CORS_STUB,
                    makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                    makeLocationStub(PARTNER.partnerId, locationsWithAllInPricing)
                ]);
                await forEachSeries(locationsWithAllInPricing, async () => {
                    await expect(getElementText(url, LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('Yes');
                });
            });

            it('should have All-In Pricing be "No" when location\'s subdivision_code is not "ON" or "QC"', async function () {
                const locationsWithoutAllInPricing = [
                    LOCATIONS.CHICAGO,
                    LOCATIONS.VANCOUVER
                ];

                await setStubs([
                    CORS_STUB,
                    makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                    makeLocationStub(PARTNER.partnerId, locationsWithoutAllInPricing)
                ])
                await forEachSeries(locationsWithoutAllInPricing, async () => {
                    await expect(getElementText(url, LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('No');
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
                ];

                await forEachSeries(locations, async location => {
                    await setStubs([
                        CORS_STUB,
                        makeSsoAuthStub(PARTNER.partnerId, authToken, account),
                        makeLocationStub(PARTNER.partnerId, [location])
                    ]);
                    await expect(getElementText(url, LOCATORS.HAS_ALL_IN_PRICING)).to.eventually.equal('No');
                });
            });
        }
    });
});
