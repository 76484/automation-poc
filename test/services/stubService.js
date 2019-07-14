const CORS_STUB = {
    predicates: [
        {
            deepEquals: {
                method: "OPTIONS"
            }
        }
    ],
    responses: [
        {
            is: {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-PARTNER-ID",
                    "Access-Control-Allow-Methods": "GET, POST",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        }
    ]
};

const makeSsoAuthStub = (partnerId, authToken, account) => {
    return {
        predicates: [
            {
                equals: {
                    path: `/v2/sso/auth/${partnerId.toLowerCase()}`,
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                        "X-PARTNER-ID": partnerId
                    }
                }
            }
        ],
        responses: [
            {
                is: {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    body: {
                        account,
                        loyalty: {},
                        program: {},
                        token: authToken
                    }
                }
            }
        ]
    };
};

const makeLocationStub = (partnerId, locations, waitMs = 0) => {
    const behaviors = {};

    if (waitMs) {
        behaviors.wait = waitMs;
    }

    return {
        predicates: [
            {
                equals: {
                    path: "/v2/locations",
                    method: "GET"
                }
            }
        ],
        responses: locations.map(location => {
            return {
                is: {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json",
                        "X-PARTNER-ID": partnerId
                    },
                    body: {
                        location,
                        success: true
                    }
                },
                _behaviors: behaviors
            }
        })
    }
};

module.exports = {
    CORS_STUB,
    makeLocationStub,
    makeSsoAuthStub
};
