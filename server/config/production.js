
// this config will be merged with the default one found in index.js
// if the enviroment was set to produciton
var prodConfig = {
    logging: false,
    db: {
        url: 'mongodb://localhost/iotApp-prod'
    }
};

module.exports = prodConfig;