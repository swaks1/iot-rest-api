import Settings from "./settingsModel";
import logger from "../../utils/logger";
import _ from "lodash";

var controller = {};

// like middleware that will interecept routes with :name
controller.param = async (req, res, next, name) => {
  Settings.findOne({ name: name })
    .exec()
    .then(result => {
      if (!result) {
        next(new Error("No settings with that name"));
      } else {
        req.settings = result;
        next();
      }
    })
    .catch(err => next(err));
};

controller.get = async (req, res, next) => {
  Settings.find({})
    .sort({ name: "desc" })
    .exec()
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
};

controller.post = async (req, res, next) => {
  var newSettings = req.body;

  Settings.create(newSettings)
    .then(settings => {
      res.json(settings);
    })
    .catch(err => next(err));
};

controller.getById = async (req, res, next) => {
  var settings = req.settings; // taken from controller.params method
  res.json(settings);
};

controller.putById = async (req, res, next) => {
  var currentSettings = req.settings;
  var newSettings = req.body;

  delete newSettings.name;

  currentSettings.value = newSettings.value;

  currentSettings
    .save()
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
};

controller.deleteById = (req, res, next) => {
  var settings = req.settings;
  settings
    .remove()
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
};

export default controller;
