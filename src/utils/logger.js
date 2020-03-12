import _ from "lodash";
import config from "../config";

var noop = () => {};

var consoleLog = config.logging ? console.log.bind(console) : noop;
var consoleErr = config.logging ? console.error.bind(console) : noop;

var logger = {
  log: function() {
    consoleLog.apply(console, arguments);
  },
  error: function() {
    consoleErr.apply(console, arguments);
  }
};

export default logger;
