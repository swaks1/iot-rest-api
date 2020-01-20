import Data from "./dataModel";
import logger from "./../../utils/logger";
import helper from "./../../utils/helper";
import mongoose from "mongoose";

var controller = {};

controller.param = async (req, res, next, id) => {
  await Data.findById(id).then(
    item => {
      if (!item) {
        next(new Error("No data with that id.."));
      } else {
        req.dataItem = item;
        next();
      }
    },
    err => next(err)
  );
};

controller.get = async (req, res, next) => {
  let deviceId = req.query.deviceId;
  let period = req.query.period;
  let pageSize = 10;
  let dataType = "LIGHT SENSOR";

  // try get pageSize
  try {
    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);
  } catch (error) {
    logger.error(error);
  }

  if (req.query.dataType && req.query.dataType != "") {
    dataType = req.query.dataType;
  }
  // Get first one... but this is async so it doesnt work, dataType coninues empty in the below code... await needed here
  // else {
  //     //get first dataType by default
  //     Data.collection.findOne()
  //         .then(response => {
  //             logger.log("OK");
  //             if (response != null) {
  //                 logger.log(response);
  //                 dataType = response.dataItem.dataValue;
  //             }
  //             else {
  //                 logger.log("No documents found (no dataType)");
  //                 res.json([]);
  //             }

  //         })
  //         .catch(err => next(err));
  // }

  if (!deviceId) {
    res.send("add device id");
  } else {
    let currentYear = new Date().getFullYear();

    // EXAMPLE
    // $match: {
    //    'created': { $gt: new Date(`${currentYear}-01-01T00:00:00.000Z`) }, //only those in last year
    // }

    let match = {};
    match["dataItem.dataType"] = dataType;
    match["device"] = mongoose.Types.ObjectId(deviceId); // must be cast to ObjectId to work
    switch (period) {
      case "monthly": // return grouped by month for current year
        match["created"] = {
          $gt: new Date(`${currentYear}-01-01T00:00:00.000Z`)
        }; // only those in last year
        Data.aggregate(
          [
            {
              $match: match
            },
            {
              $addFields: {
                dataValueDecimal: {
                  $convert: {
                    input: "$dataItem.dataValue",
                    to: "decimal",
                    onError: "Error",
                    onNull: 0
                  }
                }
              }
            },
            {
              $group: {
                _id: { month: { $month: "$created" } },
                average: { $avg: "$dataValueDecimal" }
              }
            },
            {
              $sort: {
                "_id.month": 1
              }
            },
            {
              $limit: pageSize
            }
          ],
          function(error, data) {
            if (error) {
              next(error);
            } else {
              var mappedData = data.map((item, index) => {
                let obj = JSON.parse(
                  JSON.stringify(item.average).replace("$", "")
                ); // the average is object that canot be accesed....
                let average = obj.numberDecimal;

                let year = currentYear;
                let month = item._id.month;

                if (month.toString().length == 1) {
                  month = "0" + month;
                }

                return {
                  dataItem: {
                    dataValue: average,
                    dataType: dataType
                  },
                  _id: `data${index}`,
                  device: deviceId,
                  created: `${year}-${month}`,
                  dataType: dataType
                };
              });
              res.json(mappedData);
            }
          }
        );
        break;
      case "daily": // return grouped by day
        Data.aggregate(
          [
            {
              $match: match
            },
            {
              $addFields: {
                dataValueDecimal: {
                  $convert: {
                    input: "$dataItem.dataValue",
                    to: "decimal",
                    onError: "Error",
                    onNull: 0
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: "$created" },
                  month: { $month: "$created" },
                  day: { $dayOfMonth: "$created" }
                },
                average: { $avg: "$dataValueDecimal" }
              }
            },
            {
              $sort: {
                "_id.year": -1,
                "_id.month": -1,
                "_id.day": -1
              }
            },
            {
              $limit: pageSize
            }
          ],
          function(error, data) {
            if (error) {
              next(error);
            } else {
              var mappedData = data.map((item, index) => {
                let obj = JSON.parse(
                  JSON.stringify(item.average).replace("$", "")
                ); // the average is object that canot be accesed....
                let average = obj.numberDecimal;

                let year = item._id.year;
                let month = item._id.month;
                let day = item._id.day;

                if (month.toString().length == 1) {
                  month = "0" + month;
                }

                if (day.toString().length == 1) {
                  day = "0" + day;
                }
                return {
                  dataItem: {
                    dataValue: average,
                    dataType: dataType
                  },
                  _id: `data${index}`,
                  device: deviceId,
                  created: `${year}-${month}-${day}`,
                  dataType: dataType
                };
              });
              res.json(mappedData);
            }
          }
        );
        break;
      case "lastHour": // return only those in last hour grouped by minute
        match["created"] = { $gt: new Date(Date.now() - 1000 * 60 * 60) }; // only those in last hour
        Data.aggregate(
          [
            {
              $match: match
            },
            {
              $addFields: {
                dataValueDecimal: {
                  $convert: {
                    input: "$dataItem.dataValue",
                    to: "decimal",
                    onError: "Error",
                    onNull: 0
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: "$created" },
                  month: { $month: "$created" },
                  day: { $dayOfMonth: "$created" },
                  hour: { $hour: "$created" },
                  minute: { $minute: "$created" }
                },
                average: { $avg: "$dataValueDecimal" }
              }
            },
            {
              $sort: {
                "_id.year": -1,
                "_id.month": -1,
                "_id.day": -1,
                "_id.hour": -1,
                "_id.minute": -1
              }
            },
            {
              $limit: pageSize
            }
          ],
          function(error, data) {
            if (error) {
              next(error);
            } else {
              var mappedData = data.map((item, index) => {
                let obj = JSON.parse(
                  JSON.stringify(item.average).replace("$", "")
                ); // the average is object that canot be accesed....
                let average = obj.numberDecimal;

                let year = item._id.year;
                let month = item._id.month;
                let day = item._id.day;
                let hour = item._id.hour;
                let minute = item._id.minute;

                if (month.toString().length == 1) {
                  month = "0" + month;
                }
                if (day.toString().length == 1) {
                  day = "0" + day;
                }
                if (hour.toString().length == 1) {
                  hour = "0" + hour;
                }
                if (minute.toString().length == 1) {
                  minute = "0" + minute;
                }

                let localDate = helper.getDate(
                  `${year}-${month}-${day}T${hour}:${minute}:00.000Z`
                );
                // logger.log(localDate);
                return {
                  dataItem: {
                    dataValue: average,
                    dataType: dataType
                  },
                  _id: `data${index}`,
                  device: deviceId,
                  created: localDate.substring(0, 16)
                };
              });
              res.json(mappedData);
            }
          }
        );
        break;
      case "last24h": // return only those in last 24h
        match["created"] = { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24) }; // only those in last hour
        Data.aggregate(
          [
            {
              $match: match
            },
            {
              $addFields: {
                dataValueDecimal: {
                  $convert: {
                    input: "$dataItem.dataValue",
                    to: "decimal",
                    onError: "Error",
                    onNull: 0
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: "$created" },
                  month: { $month: "$created" },
                  day: { $dayOfMonth: "$created" },
                  hour: { $hour: "$created" }
                },
                average: { $avg: "$dataValueDecimal" }
              }
            },
            {
              $sort: {
                "_id.year": -1,
                "_id.month": -1,
                "_id.day": -1,
                "_id.hour": -1
              }
            },
            {
              $limit: pageSize
            }
          ],
          function(error, data) {
            if (error) {
              next(error);
            } else {
              var mappedData = data.map((item, index) => {
                let obj = JSON.parse(
                  JSON.stringify(item.average).replace("$", "")
                ); // the average is object that canot be accesed....
                let average = obj.numberDecimal;

                let year = item._id.year;
                let month = item._id.month;
                let day = item._id.day;
                let hour = item._id.hour;
                let minute = "00";

                if (month.toString().length == 1) {
                  month = "0" + month;
                }
                if (day.toString().length == 1) {
                  day = "0" + day;
                }
                if (hour.toString().length == 1) {
                  hour = "0" + hour;
                }

                let localDate = helper.getDate(
                  `${year}-${month}-${day}T${hour}:${minute}:00.000Z`
                );
                // logger.log(localDate);
                return {
                  dataItem: {
                    dataValue: average,
                    dataType: dataType
                  },
                  _id: `data${index}`,
                  device: deviceId,
                  created: localDate.substring(0, 16)
                };
              });
              res.json(mappedData);
            }
          }
        );
        break;
      default:
        // or period=mostRecent...return most recent data
        var query = {};
        query["device"] = deviceId;
        query["dataItem.dataType"] = dataType;
        await Data.find(query)
          .sort({ created: "desc" })
          .limit(pageSize)
          .exec()
          .then(
            data => {
              let dataObj = helper.fixDates(data, "created");
              res.json(dataObj);
            },
            err => next(err)
          );
    }
  }
};

controller.post = async (req, res, next) => {
  var newData = req.body;
  if (newData.create) {
    newData.created = new Date(newData.created);
  }

  await Data.create(newData).then(
    item => {
      let itemObj = helper.fixDates(item, "created");
      res.send(itemObj);
    },
    err => next(err)
  );
};

controller.delete = async (req, res, next) => {
  let deviceId = req.query.deviceId;
  // logger.log(deviceId);
  if (!deviceId) {
    res.send("add device id");
  } else {
    var removed = await Data.deleteOne({ device: deviceId })
      .exec()
      .catch(err => next(err));

    res.json(removed);
  }
};

controller.getById = (req, res, next) => {
  var dataItem = req.dataItem;
  var dataItemObj = helper.fixDates(dataItem, "created");
  res.json(dataItemObj);
};

export default controller;
