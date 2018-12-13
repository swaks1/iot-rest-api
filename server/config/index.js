var _ = require("lodash");

var config = {
    dev: "development",
    prod: "production",
    test: "testing",
    logging: true,
    env: "development",
    port: process.env.port || 3000
};

//set enviroment if wasn's set to be default to development
process.env.NODE_ENV = process.env.NODE_ENV || config.dev;
//set current enviroment
config.env = process.env.NODE_ENV;

var envConfig;
try {
    //get configuration from current directory based on enviroment (dev,prod or test)
    envConfig = require(`./${config.env}`);
    envConfig = envConfig || {};
} catch (error) {
    envConfig = {};
}

//export the default config merged with the envConfig depending on the enviroment
module.exports = _.merge(config, envConfig);

