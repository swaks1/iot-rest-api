import Alert from "./alertModel";
import logger from "../../../utils/logger";
import _ from "lodash";

var controller = {};

// like middleware that will interecept routes with :id
controller.param = async (req, res, next, id) => {
  Alert.findById(id)
    .then(alert => {
      if (!alert) {
        next(new Error("No alert with that id.."));
      } else {
        req.alert = alert;
        next();
      }
    })
    .catch(err => next(err));
};

controller.get = async (req, res, next) => {
  var deviceId = req.query.deviceId;
  var dataType = req.query.dataType;

  var query = {};
  if (deviceId != null) {
    query["device"] = deviceId;
  }
  if (dataType != null) {
    query["dataType"] = dataType;
  }

  Alert.find(query)
    .lean()
    .exec()
    .then(result => res.json(result))
    .catch(err => next(err));
};

controller.getById = async (req, res, next) => {
  var alert = req.alert; // taken from controller.params method
  res.json(alert);
};

controller.post = async (req, res, next) => {
  let deviceId = req.body.deviceId;
  let alerts = req.body.alerts;

  try {
    let existingAlerts = await Alert.find({ device: deviceId }).exec();
    for (let i = 0; i < alerts.length; i++) {
      let alert = alerts[i];
      var existingAlert = existingAlerts.find(
        item => item.dataType == alert.dataType
      );
      if (existingAlert) {
        existingAlert.rules = alert.rules;
        existingAlert.channels = alert.channels;
        await existingAlert.save();
      } else {
        await Alert.create(alert);
      }
    }
    let updatedAlerts = await Alert.find({ device: deviceId }).exec();
    res.json(updatedAlerts);
  } catch (error) {
    next(error);
  }
};

export default controller;
