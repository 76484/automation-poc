const axios = require('axios');

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
                "protocol": "http",
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

createImposter()
    .then(() => {
        return createLocationsStub([
            LOCATIONS.TORONTO,
            LOCATIONS.VANCOUVER,
            LOCATIONS.CHICAGO
        ])
    })
    .then(() =>  {
        console.log("All Locations created.");
    })
    .catch(err => {
        console.log(err);
    });
