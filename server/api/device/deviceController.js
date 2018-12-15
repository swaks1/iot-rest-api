var Device = require('./deviceModel');
var _ = require('lodash');

var controller = {};

//like middleware that will interecept routes with :id 
controller.params = (req, res, next, id) => {
    Device.findById(id)
        .then((device) => {
            if (!device) {
                next(new Error('No device with that id..'));
            } else {
                req.device = device;
                next();
            }
        }, (err) => next(err));

};

controller.get = (req, res, next) => {
    Device.find({})
        .then(devices => {
            res.json(devices);
        }, err => next(err));

};

controller.post = (req, res, next) => {
    var newDevice = req.body;

    Device.create(newDevice)
        .then(device => {
            res.json(device);
        }, err => next(err));
};

controller.getById = (req, res, next) => {
    var device = req.device; //taken from controller.params method
    res.json(device);
};

controller.putById = (req, res, next) => {
    var device = req.device;
    var update = req.body;

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


module.exports = controller;