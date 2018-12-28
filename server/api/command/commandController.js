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
        Command.findById({ _id: commandId})
            //.populate('device')
            .exec()
            .then(data => {
                res.json(data);
            },
                err => next(err));
    }
};

controller.getNotExecutedCommand = (req, res, next) => {
    var deviceId = req.params.deviceId;
    if (!deviceId) {
        res.send("add device id");
    } else {
        Command.find({ device: deviceId, executed: false })
            //.populate('device')
            .sort({created: 'asc'})
            .exec()
            .then(data => {
                res.json(data[0]);
            },
                err => next(err));
    }
};


controller.postExecutedCommand = (req, res, next) => {
    var commandId = req.body.commandId;
    var isExecuted = req.body.executed;
    //logger.log(req.body);
    Command.findOne({ _id: commandId })
        .then(item => {
            if(item){
                item.executed = isExecuted;
                item.save();
                res.send("OK..SAVED");
            }
            else{
                res.send("not Found");
            }

        },
            err => next(err));
};

controller.getGoogleApiCert = (req, res, next) => {    
        var data = {};
        //google certificate thumbrint for SSL
        data.googleCert = [0xD6, 0x73, 0x98, 0x1A, 0x84, 0x96, 0x26, 0xD7, 0xF6, 0x10, 0x5D, 0x97, 0x8F, 0xE7, 0x47, 0x8A, 0x96, 0xB3, 0x46, 0x00]; //vazi do februari
        res.json(data);
};

module.exports = controller;