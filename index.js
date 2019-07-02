const axios = require('axios');

axios.post('http://localhost:2525/imposters', {
    "port": 4545,
    "protocol": "http",
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
            "responses": [
                {
                    "is": {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": {
                            "location": {
                                "city": "Toronto",
                                "subdivision_code": "ON"
                            },
                            "success": true
                        }
                    }
                },
                {
                    "is": {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": {
                            "location": {
                                "city": "Chicago",
                                "subdivision_code": "IL"
                            },
                            "success": true
                        }
                    }
                }
            ]
        }
    ]
});
