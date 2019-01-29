var logger = require('./logger');
var moment = require('moment');
var tz = require('moment-timezone');

//format returns local date with time zone
var helper = {
    getDateNow: function () {
        //return moment().tz("America/New_York");
        return moment().format();

    },

    getDate: function (isoString) {
        return moment(isoString).format();
    },

     //mongoose saves dates as UTC so we convert here to local
    fixDates: function (mongooseArray, property) {
        let mappedData = mongooseArray.map(item => {
            let itemObj = item.toObject();
            itemObj[property] = helper.getDate(item[property]);
            return itemObj;
        });
        return mappedData;
    }
};

module.exports = helper;