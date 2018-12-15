var _ = require('lodash');

var controller = {};

//like middleware that will interecept routes with :id 
controller.params = (req, res, next, id) => {
    req.userId = id;
    next();
};

controller.get = (req, res, next) => {
    res.send("Device GET !!");
};

controller.getOne = (req, res, next) => {
    res.send("get ONE ==> " + req.deviceId);
};

module.exports = controller;