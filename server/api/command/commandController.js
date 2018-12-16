var Command = require('./commandModel');
var logger = require('../../util/logger');
var _ = require('lodash');

var controller = {};


controller.get = (req, res, next) => {
    let deviceId = req.query.deviceId;
    //logger.log(deviceId);
    if (!deviceId) {
        res.send("add device id");
    } else {
        Command.find({ device: deviceId })
            //.populate('device')
            .exec()
            .then(data => {
                res.json(data);
            },
                err => next(err));
    }
};

controller.post = (req, res, next) => {
    var newData = req.body;
    if(newData.create){
        newData.created = new Date(newData.created);
    }

    Command.create(newData)
        .then(item => {
            res.send(item);
        },
            err => next(err));
};

controller.getById = (req, res, next) => {
    var commandId = req.params.id;
    if (!commandId) {
        res.send("add device id");
    } else {
        Command.find({ _id: commandId})
            //.populate('device')
            .exec()
            .then(data => {
                res.json(data);
            },
                err => next(err));
    }
};

controller.getNotExecutedCommands = (req, res, next) => {
    var deviceId = req.params.deviceId;
    if (!deviceId) {
        res.send("add device id");
    } else {
        Command.find({ device: deviceId, executed: false })
            //.populate('device')
            .exec()
            .then(data => {
                res.json(data);
            },
                err => next(err));
    }
};


controller.postExecutedCommand = (req, res, next) => {
    var commandId = req.body.commandId;
    Command.findOne({ _id: commandId })
        .then(item => {
            if(item){
                item.executed = true;
                item.save();
                res.send("OK..SAVED");
            }
            else{
                res.send("not Found");
            }

        },
            err => next(err));
};

module.exports = controller;