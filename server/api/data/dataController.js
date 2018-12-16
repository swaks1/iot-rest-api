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
        }, (err) => next(err));
};

controller.get = (req, res, next) => {
    let deviceId = req.query.deviceId;
    //logger.log(deviceId);
    if (!deviceId) {
        res.send("add device id");
    } else {
        Data.find({ device: deviceId })
            //.populate('device')
            .exec()
            .then(data => {
                res.json(data);
            }, err => next(err));
    }
};

controller.post = (req, res, next) => {
    var newData = req.body;
    newData.created = new Date(newData.created);

    Data.create(newData)
        .then(item => {
            res.send(item);
        }, err => next(err));
};

controller.getOne = (req, res, next) => {
    var dataItem = req.dataItem;
    res.json(dataItem);
};

module.exports = controller;