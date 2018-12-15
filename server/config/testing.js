
// this config will be merged with the default one found in index.js
// if the enviroment was set to testing
var testConfig = {
    logging: true,
    db: {
        url: 'mongodb://localhost:27017/iotApp-test'
    }
};

module.exports = testConfig;