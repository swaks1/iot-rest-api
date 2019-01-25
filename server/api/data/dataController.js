var Data = require('./dataModel');
var logger = require('../../util/logger');
var _ = require('lodash');

var controller = {};

controller.param = (req, res, next, id) => {
    Data.findById(id)
        .then((item) => {
            if (!item) {
                next(new Error('No data with that id..'));
            } else {
                req.dataItem = item;
                next();
            }
        },
            (err) => next(err));
};

controller.get = (req, res, next) => {
    let deviceId = req.query.deviceId;
    let period = req.query.period;
    let pageSize = 10;

    //try get pageSize
    try {
        if (req.query.pageSize)
            pageSize = parseInt(req.query.pageSize);
    } catch (error) {
        logger.error(error);
    }

    if (!deviceId) {
        res.send("add device id");
    } else {
        let currentYear = new Date().getFullYear();

        switch (period) {
            case "monthly":
                //return grouped by month for current year
                Data.aggregate([
                    {
                        $match: {
                            'created': { $gt: new Date(`${currentYear}-01-01T00:00:00.000Z`) } //only those in last hour
                        }
                    },
                    {
                        $addFields: {
                            dataValueDecimal: { $convert: { input: "$dataItem.dataValue", to: "decimal", onError: "Error", onNull: 0 } },
                        }
                    },
                    {
                        $group: {
                            _id: { month: { $month: "$created" } },
                            average: { $avg: "$dataValueDecimal" },
                            dataType: { $first: "$dataItem.dataType" }
                        }
                    },
                    {
                        $sort: {
                            '_id.month': 1,
                        }
                    },
                    {
                        $limit: pageSize,
                    }
                ],
                    function (error, data) {
                        if (error) {
                            next(error);
                        }
                        else {
                            var mappedData = data.map((item, index) => {

                                let obj = JSON.parse(JSON.stringify(item.average).replace("$", "")); //the average is object that canot be accesed....
                                let average = obj.numberDecimal;

                                let year = currentYear;
                                let month = item._id.month;

                                if (month.toString().length == 1) {
                                    month = "0" + month;
                                }

                                return {
                                    dataItem: {
                                        dataValue: average,
                                        dataType: item.dataType
                                    },
                                    _id: `data${index}`,
                                    device: deviceId,
                                    created: `${year}-${month}`
                                };
                            });
                            res.json(mappedData);
                        }

                    });
                break;
            case "daily":
                //return grouped by day
                Data.aggregate([
                    {
                        $addFields: {
                            dataValueDecimal: { $convert: { input: "$dataItem.dataValue", to: "decimal", onError: "Error", onNull: 0 } },
                        }
                    },
                    {
                        $group: {
                            _id: { year: { $year: "$created" }, month: { $month: "$created" }, day: { $dayOfMonth: "$created" } },
                            average: { $avg: "$dataValueDecimal" },
                            dataType: { $first: "$dataItem.dataType" }
                        }
                    },
                    {
                        $sort: {
                            '_id.year': -1,
                            '_id.month': -1,
                            '_id.day': -1
                        }
                    },
                    {
                        $limit: pageSize,
                    }
                ],
                    function (error, data) {
                        if (error) {
                            next(error);
                        }
                        else {
                            var mappedData = data.map((item, index) => {

                                let obj = JSON.parse(JSON.stringify(item.average).replace("$", "")); //the average is object that canot be accesed....
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
                                        dataType: item.dataType
                                    },
                                    _id: `data${index}`,
                                    device: deviceId,
                                    created: `${year}-${month}-${day}`
                                };
                            });
                            res.json(mappedData);
                        }

                    });
                break;
            case "lastHour":
                //return only those in last hour grouped by minute
                Data.aggregate([
                    {
                        $match: {
                            'created': { $gt: new Date(Date.now() - 1000 * 60 * 60) } //only those in last hour
                        }
                    },
                    {
                        $addFields: {
                            dataValueDecimal: { $convert: { input: "$dataItem.dataValue", to: "decimal", onError: "Error", onNull: 0 } },
                        }
                    },
                    {
                        $group: {
                            _id: { year: { $year: "$created" }, month: { $month: "$created" }, day: { $dayOfMonth: "$created" }, hour: { $hour: "$created" }, minute: { $minute: "$created" } },
                            average: { $avg: "$dataValueDecimal" },
                            dataType: { $first: "$dataItem.dataType" }
                        }
                    },
                    {
                        $sort: {
                            '_id.year': -1,
                            '_id.month': -1,
                            '_id.day': -1,
                            '_id.hour': - 1,
                            '_id.minute': -1
                        }
                    },
                    {
                        $limit: pageSize,
                    }
                ],
                    function (error, data) {
                        if (error) {
                            next(error);
                        }
                        else {
                            var mappedData = data.map((item, index) => {

                                let obj = JSON.parse(JSON.stringify(item.average).replace("$", "")); //the average is object that canot be accesed....
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

                                return {
                                    dataItem: {
                                        dataValue: average,
                                        dataType: item.dataType
                                    },
                                    _id: `data${index}`,
                                    device: deviceId,
                                    created: `${year}-${month}-${day}T${hour}:${minute}`
                                };
                            });
                            res.json(mappedData);
                        }

                    });
                break;
            default: //or period=mostRecent
                //return most recent data
                Data.find({ device: deviceId })
                    .sort({ created: 'desc' })
                    .limit(pageSize)
                    .exec()
                    .then(data => {
                        res.json(data);
                    },
                        err => next(err));

        }

    }
};

controller.post = (req, res, next) => {
    var newData = req.body;
    if (newData.create) {
        newData.created = new Date(newData.created);
    }

    Data.create(newData)
        .then(item => {
            res.send(item);
        },
            err => next(err));
};


controller.delete = (req, res, next) => {
    let deviceId = req.query.deviceId;
    //logger.log(deviceId);
    if (!deviceId) {
        res.send("add device id");
    } else {
        Data.remove({ device: deviceId })
            .exec()
            .then(data => {
                res.json(data);
            },
                err => next(err));
    }
};

controller.getById = (req, res, next) => {
    var dataItem = req.dataItem;
    res.json(dataItem);
};


module.exports = controller;