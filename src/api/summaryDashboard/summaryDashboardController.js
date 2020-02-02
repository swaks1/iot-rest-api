import SummaryDashboard from "./summaryDashboardModel";
import logger from "../../utils/logger";
import _ from "lodash";

var controller = {};

// like middleware that will interecept routes with :name
controller.param = async (req, res, next, name) => {
  SummaryDashboard.findOne({ name: name })
    .exec()
    .then(result => {
      if (!result) {
        next(new Error("No SummaryDashboard with that name"));
      } else {
        req.summaryDashboard = result;
        next();
      }
    })
    .catch(err => next(err));
};

controller.get = async (req, res, next) => {
  SummaryDashboard.find({})
    .sort({ name: "desc" })
    .exec()
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
};

controller.post = async (req, res, next) => {
  var newSummaryDashboard = req.body;

  SummaryDashboard.create(newSummaryDashboard)
    .then(summaryDashboard => {
      res.json(summaryDashboard);
    })
    .catch(err => next(err));
};

controller.getById = async (req, res, next) => {
  var summaryDashboard = req.summaryDashboard; // taken from controller.params method
  res.json(summaryDashboard);
};

controller.putById = async (req, res, next) => {
  var currentSummaryDashboard = req.summaryDashboard;
  var newSummaryDashboard = req.body;

  delete newSummaryDashboard.name;

  currentSummaryDashboard.value = newSummaryDashboard.value;

  currentSummaryDashboard
    .save()
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
};

controller.deleteById = (req, res, next) => {
  var summaryDashboard = req.summaryDashboard;
  summaryDashboard
    .remove()
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
};

controller.updatePeriodInPast = async (req, res, next) => {
  var currentSummaryDashboard = req.summaryDashboard;
  var newPeriodInPast = req.body.periodInPast;

  currentSummaryDashboard.value = {
    ...currentSummaryDashboard.value,
    periodInPast: newPeriodInPast
  };

  currentSummaryDashboard
    .save()
    .then(result => {
      res.json({ periodInPast: result.value.periodInPast });
    })
    .catch(err => next(err));
};

controller.updateDevices = async (req, res, next) => {
  var currentSummaryDashboard = req.summaryDashboard;
  var newDevices = req.body.devices;

  currentSummaryDashboard.value = {
    ...currentSummaryDashboard.value,
    devices: newDevices
  };

  currentSummaryDashboard
    .save()
    .then(result => {
      res.json(result.value.devices);
    })
    .catch(err => next(err));
};

controller.updateDataTypes = async (req, res, next) => {
  var currentSummaryDashboard = req.summaryDashboard;
  var newDataTypes = req.body.dataTypes;

  currentSummaryDashboard.value = {
    ...currentSummaryDashboard.value,
    dataTypes: newDataTypes
  };

  currentSummaryDashboard
    .save()
    .then(result => {
      res.json(result.value.dataTypes);
    })
    .catch(err => next(err));
};

export default controller;
