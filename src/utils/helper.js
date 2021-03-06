// import logger from "./logger";
import moment from "moment";
// import tz from "moment-timezone";

// format returns local date with time zone
var helper = {
  getDateNow: function() {
    // return moment().tz("America/New_York");
    return moment().format();
  },

  // Local date to string
  getDate: function(isoString) {
    return moment(isoString).format();
  },

  // mongoose saves dates as UTC so we convert here to local
  fixDates: function(mongooseObject, property) {
    if (mongooseObject instanceof Array) {
      let mappedData = mongooseObject.map(item => {
        let itemObj = { ...item };
        if (typeof item.toObject !== "undefined") {
          itemObj = item.toObject();
        }
        itemObj[property] = helper.getDate(itemObj[property]);
        return itemObj;
      });
      return mappedData;
    } else {
      let itemObj = { ...mongooseObject };
      if (typeof mongooseObject.toObject !== "undefined") {
        itemObj = mongooseObject.toObject();
      }
      itemObj[property] = helper.getDate(itemObj[property]);
      return itemObj;
    }
  },

  getRandomHexString: length => {
    return Math.random()
      .toString(16)
      .slice(2, length + 2);
  }
};

export default helper;
