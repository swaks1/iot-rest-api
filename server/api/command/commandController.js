var Command = require('./commandModel');
var Device = require('../device/deviceModel');
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
            .sort('-created')
            .limit(5)
            .exec()
            .then(data => {
                res.json(data);
            },
                err => next(err));
    }
};

controller.post = (req, res, next) => {
    var newData = req.body;
    if (newData.create) {
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
        Command.findById({ _id: commandId })
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
            .sort({ created: 'asc' })
            .exec()
            .then(data => {
                if (data.length > 0) {
                    res.json(data[0]);
                }
                else {
                    res.status(404).send();
                }
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
            if (item) {
                item.executed = isExecuted;
                item.save();

                //update what this command meant for the device
                controller.UpdateDeviceFromExecutedCommand(item);

                res.send("OK..SAVED");
            }
            else {
                res.send("not Found");
            }

        },
            err => next(err));
};

controller.UpdateDeviceFromExecutedCommand = (command) => {
    Device.findById(command.device)
        .then((device) => {
            if (!device) {
                //next(new Error('No device with that id..'));
                logger.log("No Device with that ID...");
            } else {
                if (command.commandItem.commandType == "IS_ACTIVE") {
                    if (command.commandItem.commandValue.toLowerCase() == "true") {
                        device.isActive = true;
                    }
                    else if (command.commandItem.commandValue.toLowerCase() == "false") {
                        device.isActive = false;
                    }
                }

                if (command.commandItem.commandType == "SEND_DATA_DELAY") {
                    device.sendDataDelay = command.commandItem.commandValue;
                }

                device.save();
            }
        },
            (err) => logger.error(err));
};


controller.getGoogleApiCert = (req, res, next) => {
    var data = {};
    //google certificate thumbrint for SSL
    //data.googleCert = [0xD6, 0x73, 0x98, 0x1A, 0x84, 0x96, 0x26, 0xD7, 0xF6, 0x10, 0x5D, 0x97, 0x8F, 0xE7, 0x47, 0x8A, 0x96, 0xB3, 0x46, 0x00]; //vazi do februari
    data.googleCert = [0xBB, 0x64, 0x14, 0x3F, 0x4B, 0x0D, 0x81, 0xF5, 0xE0, 0xDA, 0xD3, 0x2C, 0x03, 0x80, 0x01, 0x8E, 0xDB, 0x78, 0x1D, 0xEF]; //vazi do april

    res.json(data);
};

module.exports = controller;