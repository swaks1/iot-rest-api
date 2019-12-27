import Device from "./deviceModel";
import Command from "../command/commandModel"; // maybe refactor this so logic for Commands wont be in the deviceController ?
import Data from "../data/dataModel";
import logger from "../../utils/logger";
import _ from "lodash";
// import helper from "../../utils/helper";

var controller = {};

// like middleware that will interecept routes with :id
controller.param = async (req, res, next, id) => {
  var device = await Device.findById(id).catch(err => next(err));
  if (!device) {
    next(new Error("No device with that id.."));
  } else {
    req.device = device;
    next();
  }
};

controller.get = async (req, res, next) => {
  var devices = await Device.find({})
    .sort({ created: "desc" })
    .exec()
    .catch(err => next(err));

  res.json(devices);
};

controller.post = async (req, res, next) => {
  var newDevice = req.body;

  await Device.create(newDevice).then(
    device => {
      res.json(device);
    },
    err => next(err)
  );
};

controller.getById = async (req, res, next) => {
  var device = req.device; // taken from controller.params method
  res.json(device);
};

controller.putById = async (req, res, next) => {
  var device = req.device;
  var update = req.body;

  delete update.name;
  delete update.password;
  delete update._id;

  _.merge(device, update);

  await device.save((err, saved) => {
    if (err) {
      next(err);
    } else {
      res.json(saved);
    }
  });
};

controller.deleteById = (req, res, next) => {
  var device = req.device;
  device.remove((err, removed) => {
    if (err) {
      next(err);
    } else {
      res.json(removed);
    }
  });
};

controller.reloadDataTypes = async (req, res, next) => {
  var deviceId = req.body.deviceId;
  if (!deviceId) {
    next(new Error("No device with that id.."));
    return;
  }
  var device = await Device.findById(deviceId).catch(err => next(err));

  let dataTypes = await Data.collection
    .distinct("dataItem.dataType", { device: device._id })
    .catch(err => next(err));

  device.dataTypes = dataTypes;
  var savedDevice = await device.save();
  res.json(savedDevice);
};

controller.LoginRegister = async (req, res, next) => {
  var reqDevice = req.body;

  var existingDevice = await Device.findOne({ name: reqDevice.name })
    .select("+password") // paswword is excluded in the Schema (select:false)
    .exec()
    .catch(err => next(err));

  if (!existingDevice) {
    logger.log("device not found --> " + reqDevice.name + " ..creting new ");
    var createdDevice = await Device.create(reqDevice).catch(err => next(err));
    createdDevice = createdDevice.toObject(); // converts the mongoose object to JS object so its property can be deleted
    delete createdDevice.password;
    // add command for retrieving locaiton
    controller.AddLocationCommand(createdDevice._id);
    res.json(createdDevice);
  } else {
    if (existingDevice.password == reqDevice.password) {
      logger.log("ok name ok password --> " + reqDevice.name);
      existingDevice = existingDevice.toObject(); // converts the mongoose object to JS object so its property can be deleted
      delete existingDevice.password;
      res.json(existingDevice);
    } else {
      logger.log("ok name wrong password --> " + reqDevice.name);
      res.status(400).send("WRONG PASSWORD");
    }
  }
};

controller.AddLocationCommand = async id => {
  var command = {
    device: id,
    commandItem: {
      commandValue: "",
      commandType: "DEVICE_INFO"
    }
  };
  await Command.create(command).then(
    item => {
      logger.log("Created Location Command for " + id + " with id" + item._id);
    },
    err => logger.error(err)
  );
};

controller.modifyTTNInfo = async (req, res, next) => {
  var reqDevice = req.body;

  var existingDevice = await Device.findById(reqDevice._id)
    .exec()
    .catch(err => {
      next(err);
    });

  if (!existingDevice) {
    logger.log("device not found --> " + reqDevice._id);
    res.status(400).send("Device Not Found");
  } else {
    if (reqDevice.ttnInfo) {
      existingDevice.ttnInfo.app_id = reqDevice.ttnInfo.app_id;
      existingDevice.ttnInfo.dev_id = reqDevice.ttnInfo.dev_id;
    } else {
      existingDevice.ttnInfo = null;
    }

    var result = await existingDevice.save().catch(err => next(err));
    return res.json(result);
  }
};

export default controller;
