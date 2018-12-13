
// this config will be merged with the default one found in index.js
// if the enviroment was set to development
var devConfig = {
    logging: true,
    db: {
        url: 'mongodb://localhost/iotApp'
    }
};

module.exports = devConfig;