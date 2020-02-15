import AlertHistory from "./alertHistoryModel";
import logger from "../../../utils/logger";
import helper from "../../../utils/helper";
import _ from "lodash";

var controller = {};

// like middleware that will interecept routes with :id
controller.param = async (req, res, next, id) => {
  AlertHistory.findById(id)
    .then(alertHistoryItem => {
      if (!alertHistoryItem) {
        next(new Error("No alert hisotry item with that id.."));
      } else {
        req.alertHistoryItem = alertHistoryItem;
        next();
      }
    })
    .catch(err => next(err));
};

controller.get = async (req, res, next) => {
  var deviceId = req.query.deviceId;
  if (!deviceId) {
    next(new Error("add deviceId to query string !"));
    return;
  }

  let pageSize = 10;
  try {
    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);
  } catch (error) {
    logger.error(error);
  }

  var query = {};
  query["device"] = deviceId;

  AlertHistory.find(query)
    .sort({ created: "desc" })
    .limit(pageSize)
    .exec()
    .then(result => {
      let mappedResult = helper.fixDates(result, "created");
      mappedResult = mappedResult.map(item => {
        item.rulesTriggered = helper.fixDates(item.rulesTriggered, "created");
        return item;
      });
      res.json(mappedResult);
    })
    .catch(err => next(err));
};

controller.getById = async (req, res, next) => {
  res.json(req.alertHistoryItem); // taken from controller.params method
};

controller.post = async (req, res, next) => {
  var newAlertHistoryItem = req.body;

  await AlertHistory.create(newAlertHistoryItem).then(
    alertHistoryItem => {
      let result = helper.fixDates(alertHistoryItem, "created");
      result.rulesTriggered = helper.fixDates(result.rulesTriggered, "created");
      res.json(result);
    },
    err => next(err)
  );
};

export default controller;
