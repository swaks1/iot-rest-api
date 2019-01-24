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
        switch (period) {
            case "daily":
                //return ALL
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
                            res.json(data);
                        }

                    });
                break;
            case "lastHour":
                //return ALL
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
                            res.json(data);
                        }

                    });
                break;
            default:
                //return ALL
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