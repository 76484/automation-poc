const axios = require('axios');

const MOCK_API_URL = 'http://localhost:2525';
const MOCK_API_PROTOCOL = 'http';
const IMPOSTER_PORT = 4545;

const createImposter = async () => {
    await axios.delete(`${MOCK_API_URL}/imposters/${IMPOSTER_PORT}`);
    return axios.post(`${MOCK_API_URL}/imposters`, {
        port: IMPOSTER_PORT,
        protocol: MOCK_API_PROTOCOL
    });
};

const setStubs = stubs => {
    return axios.put(`${MOCK_API_URL}/imposters/${IMPOSTER_PORT}/stubs`, { stubs });
};

module.exports = {
    createImposter,
    setStubs
};
