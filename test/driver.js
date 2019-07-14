const {
    Builder,
    By,
    until
} = require('selenium-webdriver');

const TIMEOUT_MS = 10 * 1000;

const LOCATORS = {
    HAS_ALL_IN_PRICING: By.id('HasAllInPricing'),
    LOCATION: By.id('Location')
};

const createDriver = async () => {
    return await new Builder()
        .forBrowser('chrome')
        .build();
};

const getElementText = async (url, locator) => {
    const driver = await createDriver();

    try {
        await driver.get(url);

        const el = await driver.wait(
            until.elementLocated(locator, TIMEOUT_MS)
        );

        return await driver.wait(() => el.getText(), TIMEOUT_MS);
    } finally {
        driver.quit();
    }
};

module.exports = {
    LOCATORS,
    getElementText
};
