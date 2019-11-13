import { merge } from "lodash";

const env = process.env.NODE_ENV || "development";

const baseConfig = {
  env,
  isDev: env === "development",
  isTest: env === "testing",
  port: process.env.port || 3000,
  logging: true,
  secrets: {
    jwt: process.env.JWT_SECRET,
    jwtExp: "100d"
  }
};

let envConfig = {};

switch (env) {
  case "dev":
  case "development":
    envConfig = require("./development").config;
    break;
  case "test":
  case "testing":
    envConfig = require("./testing").config;
    break;
  case "production":
    envConfig = require("./production").config;
    break;
  default:
    envConfig = require("./development").config;
}

export default merge(baseConfig, envConfig);
