var Device = require('./deviceModel');
var Command = require('../command/commandModel'); //maybe refactor this so logic for Commands wont be in the deviceController ?
var logger = require('../../util/logger');
var _ = require('lodash');

var controller = {};

//like middleware that will interecept routes with :id 
controller.param = (req, res, next, id) => {
    Device.findById(id)
        .then((device) => {
            if (!device) {
                next(new Error('No device with that id..'));
            } else {
                req.device = device;
                next();
            }
        },
            (err) => next(err));

};

controller.get = (req, res, next) => {
    Device.find({})
        .sort({ created: 'desc' })
        .exec()
        .then(devices => {
            res.json(devices);
        },
            err => next(err));

};

controller.post = (req, res, next) => {
    var newDevice = req.body;

    Device.create(newDevice)
        .then(device => {
            res.json(device);
        },
            err => next(err));
};

controller.getById = (req, res, next) => {
    var device = req.device; //taken from controller.params method
    //res.json(device);
    Device.findById(device.id)
        .select('+password') //paswword is excluded in the Schema (select:false)
        .exec()
        .then(device => {
            res.json(device);
        },
            err => next(err));
};

controller.putById = (req, res, next) => {
    var device = req.device;
    var update = req.body;

    delete update.name;
    delete update.password;
    delete update._id;

    _.merge(device, update);

    device.save((err, saved) => {
        if (err) {
            next(err);
        }
        else {
            res.json(saved);
        }
    });
};

controller.deleteById = (req, res, next) => {
    var device = req.device;
    device.remove((err, removed) => {
        if (err) {
            next(err);
        }
        else {
            res.json(removed);
        }
    });
};

controller.LoginRegister = (req, res, next) => {
    var reqDevice = req.body;
    Device.findOne({ name: reqDevice.name })
        .select('+password') //paswword is excluded in the Schema (select:false)
        .exec()
        .then(device => {
            if (!device) {
                logger.log("device not found --> " + reqDevice.name + " ..creting new ");
                Device.create(reqDevice)
                    .then(createdDevice => {
                        createdDevice = createdDevice.toObject(); //converts the mongoose object to JS object so its property can be deleted
                        delete createdDevice.password;
                        //add command for retrieving locaiton
                        controller.AddLocationCommand(createdDevice._id);
                        res.json(createdDevice);
                    },
                        err => next(err));
            }
            else {
                if (device.password == reqDevice.password) {
                    logger.log("ok name ok password --> " + reqDevice.name);
                    device = device.toObject(); //converts the mongoose object to JS object so its property can be deleted
                    delete device.password;
                    res.json(device);
                }
                else {
                    logger.log("ok name wrong password --> " + reqDevice.name);
                    res.status(400);
                    res.send("WRONG PASSWORD");
                }
            }

        },
            err => next(err));

};

controller.AddLocationCommand = (id) => {
    var command = {
        device: id,
        commandItem: {
            commandValue: "",
            commandType: "DEVICE_INFO"
        }
    };
    Command.create(command)
        .then(item => {
            logger.log("Created Location Command for " + id + " with id" + item._id);
        },
            err => logger.error(err));
};

module.exports = controller;