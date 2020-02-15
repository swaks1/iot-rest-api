import config from "./config";
import logger from "./utils/logger";
import helper from "./utils/helper";
import Device from "./api/device/deviceModel";
import Data from "./api/data/dataModel";
import Alert from "./api/alerts/alert/alertModel";
import AlertHistory from "./api/alerts/alertHistory/alertHistoryModel";
import schedule from "node-schedule";
import nodemailer from "nodemailer";

export const startAlertScheduler = async () => {
  // currently schedule time 1 minute.. check cron format
  schedule.scheduleJob("*/1 * * * *", function() {
    logger.log("Checking for alerts...");
    checkAllDevicesForAlerts();
  });
  return Promise.resolve(true);
};

var checkAllDevicesForAlerts = async () => {
  let devices = await Device.find({})
    .lean()
    .exec();
  for (let i = 0; i < devices.length; i++) {
    let device = devices[i];
    await handleDevice(device);
  }
};

var handleDevice = async device => {
  try {
    let alerts = await Alert.find({ device: device._id })
      .lean()
      .exec();
    let alertsFiltered = alerts.filter(alert =>
      alert.rules.some(rule => rule.selected)
    );
    let dataTypes = alertsFiltered.map(alert => alert.dataType);
    let alertsToSend = [];

    for (let i = 0; i < dataTypes.length; i++) {
      let dataType = dataTypes[i];
      var data = await Data.find({
        device: device._id,
        "dataItem.dataType": dataType
      })
        .sort({ created: -1 })
        .limit(1)
        .lean()
        .exec();
      if (data && data.length > 0) {
        let alertHistoryItem = await checkAlert(data[0]);
        if (alertHistoryItem) {
          alertsToSend.push(alertHistoryItem);
        }
      }
    }

    if (alertsToSend.length > 0) {
      sendAlerts(alertsToSend, device.name);
    }
  } catch (error) {
    logger.log(error, new Date());
  }
};

var checkAlert = async data => {
  let alert = await Alert.findOne({
    device: data.device,
    dataType: data.dataItem.dataType
  })
    .lean()
    .exec();

  if (alert) {
    let rulesTriggered = [];
    let rules = alert.rules.filter(rule => rule.selected == true);
    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i];
      let ruleTriggered = checkIfRuleIsTriggered(data, rule);
      if (ruleTriggered) {
        rulesTriggered.push(ruleTriggered);
      }
    }
    if (rulesTriggered.length > 0) {
      let alertHistoryItem = await addOrUpdateAlertHistoryItem(
        data,
        rulesTriggered,
        alert
      );
      return alertHistoryItem;
    }
  }

  return null;
};

var checkIfRuleIsTriggered = (data, rule) => {
  if (rule.operator == "greater") {
    let operatorValue = parseFloat(rule.operatorValue);
    let actualValue = parseFloat(data.dataItem.dataValue);
    if (actualValue > operatorValue) {
      return {
        operator: "greater",
        operatorValue,
        actualValue
      };
    }
  }

  if (rule.operator == "less") {
    let operatorValue = parseFloat(rule.operatorValue);
    let actualValue = parseFloat(data.dataItem.dataValue);
    if (actualValue < operatorValue) {
      return {
        operator: "less",
        operatorValue,
        actualValue
      };
    }
  }

  if (rule.operator == "lastSeen") {
    let operatorValue = parseInt(rule.operatorValue); // minutes
    let maxDifference = 1000 * 60 * operatorValue; // miliseconds

    let dateFromData = new Date(data.created);
    let dateNow = new Date();

    if (dateNow - dateFromData > maxDifference) {
      return {
        operator: "lastSeen",
        operatorValue,
        actualValue: helper.getDate(dateFromData)
      };
    }
  }

  return null;
};

var addOrUpdateAlertHistoryItem = async (data, rulesTriggered, alert) => {
  let changed = false;
  let alertHistoryItem = await AlertHistory.findOne({
    device: data.device,
    data: data._id
  }).exec();

  if (alertHistoryItem) {
    rulesTriggered.forEach(ruleTriggered => {
      let existing = alertHistoryItem.rulesTriggered.find(
        item => item.operator == ruleTriggered.operator
      );
      if (!existing) {
        alertHistoryItem.rulesTriggered.push(ruleTriggered);
        changed = true;
      }
    });
    if (changed) {
      alertHistoryItem.channels = alert.channels
        .filter(item => item.selected)
        .map(item => item.name);
      await alertHistoryItem.save();
    }
  } else {
    alertHistoryItem = await AlertHistory.create({
      device: data.device,
      dataType: data.dataItem.dataType,
      data: data._id,
      rulesTriggered: rulesTriggered,
      channels: alert.channels
        .filter(item => item.selected)
        .map(item => item.name)
    });
    changed = true;
  }
  if (changed) {
    return alertHistoryItem;
  } else {
    return null;
  }
};

var sendAlerts = async (alertsToSend, deviceName) => {
  // by mail
  let alertsForMail = alertsToSend.filter(alert =>
    alert.channels.some(item => item == "email")
  );
  if (alertsForMail.length > 0) {
    let device = {
      name: deviceName,
      alerts: alertsForMail
    };
    sendMail(device);
  }

  // by sms ?
};

var transport = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: true, // use SSL
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

var sendMail = device => {
  let alerts = device.alerts.map(alert => {
    let dataType = alert.dataType;
    let rules = alert.rulesTriggered.map(rule => {
      return getRow(rule);
    });
    return `<h2>${dataType} </h2>
            <table id="alertsTable">
              <tr>
                <th>Operator</th>
                <th>Ref Value</th> 
                <th>Actual Value</th>
              </tr>
              ${rules.join("")}
            </table>
            <br/>
            <hr/>`;
  });
  const message = {
    from: config.email.from, // Sender address (wont work.. gmail sends the source address)
    to: config.email.to,
    subject: `Alert for device: ${device.name} `,
    html: `
    <style>
      #alertsTable {
        font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }
      
      #alertsTable td, #alertsTable th {
        border: 1px solid #ddd;
        padding: 8px;
      }
      
      #alertsTable tr:nth-child(even){background-color: #f2f2f2;}
      
      #alertsTable tr:hover {background-color: #ddd;}
      
      #alertsTable th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #4CAF50;
        color: white;
      }
    </style>

    <h1>WARNING for ${device.name}!</h1>
    <p>The following rules were triggered for <b>${device.name}</b></p>
    <br/><br/>
    ${alerts.join("")}`
  };

  transport.sendMail(message, function(err, info) {
    if (err) {
      logger.log(err);
    } else {
      logger.log(info);
    }
  });
};

var getRow = rule => {
  let { operator, operatorValue, actualValue } = rule;
  if (operator == "lastSeen") {
    operatorValue = operatorValue + " min";
    actualValue = actualValue.substring(0, 19).replace("T", " ");
  }
  return `<tr>
          <td><b>${operator}</b></td>
          <td> ${operatorValue}</td> 
          <td> <b>${actualValue}</b></td>
        </tr>`;
};

// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------

var alertsMethods = {};

alertsMethods.checkAlert = checkAlert;
alertsMethods.sendAlerts = sendAlerts;

export const alertsAPI = alertsMethods;
