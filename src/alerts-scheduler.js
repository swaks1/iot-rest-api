import config from "./config";
import logger from "./utils/logger";
import helper from "./utils/helper";
import Device from "./api/device/deviceModel";
import Data from "./api/data/dataModel";
import Alert from "./api/alerts/alert/alertModel";
import AlertHistory from "./api/alerts/alertHistory/alertHistoryModel";
import schedule from "node-schedule";
import nodemailer from "nodemailer";
import BlynkLib from "blynk-library";

// mail
var transport = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: true, // use SSL
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

var blynk = new BlynkLib.Blynk(config.blynkAccesskey);
let terminal = new blynk.WidgetTerminal(2);
// let v1 = new blynk.VirtualPin(1);
// let v9 = new blynk.VirtualPin(9);
// v1.on("write", function(param) {
//   console.log("V1:", param);
// });
// v9.on("read", function() {
//   v9.write(new Date());
// });

export const startAlertScheduler = async () => {
  // currently schedule time 1 minute.. check cron format
  schedule.scheduleJob("*/1 * * * *", function() {
    logger.log("Checking for alerts...");
    checkAllDevicesForAlertsAndSend();
  });

  return Promise.resolve(true);
};

var checkAllDevicesForAlertsAndSend = async () => {
  let devices = await Device.find({})
    .lean()
    .exec();
  let devicesWithAlerts = [];
  for (let i = 0; i < devices.length; i++) {
    let device = devices[i];
    let deviceWithAlerts = await handleDevice(device);
    if (deviceWithAlerts) {
      devicesWithAlerts.push(deviceWithAlerts);
    }
  }
  if (devicesWithAlerts.length > 0) {
    sendAlerts(devicesWithAlerts);
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
      return {
        deviceName: device.name,
        alertsToSend: alertsToSend
      };
    }
    return null;
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

var sendAlerts = async devicesWithAlerts => {
  // by mail
  let devicesWithMail = devicesWithAlerts.filter(device =>
    device.alertsToSend.some(alert =>
      alert.channels.some(item => item == "email")
    )
  );
  devicesWithMail = devicesWithMail.map(device => ({
    ...device,
    alertsToSend: device.alertsToSend.filter(alert =>
      alert.channels.some(item => item == "email")
    )
  }));
  if (devicesWithMail.length > 0) {
    sendMail(devicesWithMail);
  }

  // by blynk ?
  let devicesWithBlynk = devicesWithAlerts.filter(device =>
    device.alertsToSend.some(alert =>
      alert.channels.some(item => item == "blynk")
    )
  );
  devicesWithBlynk = devicesWithBlynk.map(device => ({
    ...device,
    alertsToSend: device.alertsToSend.filter(alert =>
      alert.channels.some(item => item == "blynk")
    )
  }));
  if (devicesWithBlynk.length > 0) {
    sendBlynk(devicesWithBlynk);
  }
};

var sendMail = devices => {
  let mailBody = "";
  devices.forEach(device => {
    let deviceHtml = generateHTMLForDevice(device);
    mailBody += deviceHtml;
  });
  let deviceNames = devices.map(device => device.deviceName);
  let subject = `Alerts for ${deviceNames.join(", ")}`;

  const message = composeMail(subject, mailBody);
  transport.sendMail(message, function(err, info) {
    if (err) {
      logger.log(err);
    } else {
      logger.log(info);
    }
  });
};

var generateHTMLForDevice = device => {
  let alerts = device.alertsToSend.map(alert => {
    let dataType = alert.dataType;
    let rules = alert.rulesTriggered.map(rule => {
      let ruleModified = getRuleModified(rule);
      return `<tr>
        <td><b>${ruleModified.operator}</b></td>
        <td> ${ruleModified.operatorValue}</td> 
        <td> <b>${ruleModified.actualValue}</b></td>
      </tr>`;
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
  return `
      <h1>${device.deviceName}!</h1>
      <p>The following rules were triggered for <b>${device.deviceName}</b></p>
      <br/>
      ${alerts.join("")}
      <br/>
      <br/>
      <hr/>
      `;
};

var getRuleModified = rule => {
  let { operator, operatorValue, actualValue } = rule;
  if (operator == "lastSeen") {
    operatorValue = operatorValue + " min";
    actualValue = actualValue.substring(0, 19).replace("T", " ");
  }
  return { ...rule, operator, operatorValue, actualValue };
};

var composeMail = (subject, body) => {
  return {
    from: config.email.from, // Sender address (wont work.. gmail sends the source address)
    to: config.email.to,
    subject: subject,
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
  
  ${body}`
  };
};

var sendBlynk = devices => {
  let messageBody = "";
  devices.forEach(device => {
    let deviceText = generateTEXTForDevice(device);
    messageBody += deviceText;
  });
  let deviceNames = devices.map(device => device.deviceName);
  let subject = `Alerts for ${deviceNames.join(", ")}`;

  const message = `------------###############------------
${subject}
${messageBody}
------------###############------------\n\n\n`;

  blynk.notify("Alerts for devices !!");
  terminal.write(message);
};

var generateTEXTForDevice = device => {
  let alerts = device.alertsToSend.map(alert => {
    let dataType = alert.dataType;
    let rules = alert.rulesTriggered.map(rule => {
      let ruleModified = getRuleModified(rule);
      let op = ruleModified.operator.padStart(8);
      let refValue = ruleModified.operatorValue.padStart(7);
      let actValue = ruleModified.actualValue.padEnd(20);
      return `${op} | ${refValue} | ${actValue}`;
    });
    return `${dataType}:
${"op".padStart(8)} | ${"refVal".padStart(7)} | ${"actVal".padEnd(20)}
${rules.join("\n")}
---------------------------------------`;
  });
  let fullDate = helper.getDate(new Date().toISOString());
  let date = fullDate.substring(0, 10);
  let time = fullDate.substring(11, 19);
  return `---------------------------------------
date:   ${date} ${time}
device: ${device.deviceName.toUpperCase()}
---------------------------------------
${alerts.join("\n")}
`;
};

// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------

var alertsMethods = {};

alertsMethods.checkAlert = checkAlert;
alertsMethods.sendAlerts = sendAlerts;

export const alertsAPI = alertsMethods;
