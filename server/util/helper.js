var logger = require('./logger');
var moment = require('moment');
var tz = require('moment-timezone');

//use .format() on the returned moment..
var helper = {
    getDateNow: function () {
        //return moment().tz("America/New_York");
        return moment().format();

    },

    getDate: function (isoString) {
        return moment(isoString).format();
    }
};

module.exports = helper;