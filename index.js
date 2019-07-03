var assert = require('assert');
const axios = require('axios');
const {
    Builder,
    By,
    until
} = require('selenium-webdriver');

const MOUNTEBANK_URL = "http://localhost:2525"
const IMPOSTER_PORT = 4545;

const LOCATIONS = {
    CHICAGO: {
        "city": "Chicago",
        "subdivision_code": "IL"
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
    return axios.post(`${MOUNTEBANK_URL}/imposters/${IMPOSTER_PORT}/stubs`, {
        "stub": {
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
    });
};

describe('Location', () => {
    it('should be set with city and subdivision code from Location response', done => {
        createImposter()
            .then(() => {
                return createLocationsStub([
                    LOCATIONS.TORONTO,
                    LOCATIONS.VANCOUVER,
                    LOCATIONS.CHICAGO
                ])
            })
            .then(() =>  {
                return new Promise(resolve => {
                    new Builder()
                        .forBrowser('chrome')
                        .build()
                        .then(driver => resolve(driver));
                });
            })
            .then(driver => {
                return driver
                    .get('http://localhost:3000')
                    .then(() => {
                        return driver.wait(
                            until.elementLocated(By.id('Location'), 10 * 1000)
                        );
                    })
                    .then(el => el.getText())
                    .then(text => {
                        assert.equal(text, 'Toronto, ON');
                        done()
                    })
                    .finally(() => {
                        driver.quit();
                    });
            })
            .catch(err => done(err));
    });
});
