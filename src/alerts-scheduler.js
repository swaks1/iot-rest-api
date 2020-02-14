import config from "./config";
import logger from "./utils/logger";
import helper from "./utils/helper";
import Device from "./api/device/deviceModel";
import Data from "./api/data/dataModel";
import Command from "./api/command/commandModel";
import schedule from "node-schedule";
import nodemailer from "nodemailer";

export const startAlertScheduler = async () => {
  // 1 minute
  schedule.scheduleJob("*/1 * * * *", function() {
    // printStuff();
    sendMail({
      name: "Home-device",
      alerts: [
        {
          dataType: "temperature",
          rules: [
            {
              operator: "greater",
              operatorValue: "40",
              actualValue: 44
            },
            {
              operator: "notSeen",
              operatorValue: "120min",
              actualValue: ""
            }
          ]
        },
        {
          dataType: "humidity",
          rules: [
            {
              operator: "lower",
              operatorValue: "12",
              actualValue: 9
            },
            {
              operator: "greater",
              operatorValue: "40",
              actualValue: 44
            },
            {
              operator: "notSeen",
              operatorValue: "120min",
              actualValue: ""
            }
          ]
        }
      ]
    });
  });

  return Promise.resolve(true);
};

// EXAMPLE every 5 minutes
// var event = schedule.scheduleJob("*/5 * * * *", function() {
//   console.log('This runs every 5 minutes');
// });
// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)

var printStuff = () => {
  console.log("hey", new Date());
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
    let rules = alert.rules.map(rule => {
      return `<tr>
                <td><b>${rule.operator}</b></td>
                <td> ${rule.operatorValue}</td> 
                <td> <b>${rule.actualValue}</b></td>
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
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------

// var ttnDataMethods = {};

// ttnDataMethods.sendUplink = async (
//   devId,
//   hexDataArray,
//   port = 1,
//   confirmed = false
// ) => {
//   dataClient.send(devId, Buffer.from(hexDataArray), port, confirmed);
// };

// export const ttnDataAPI = ttnDataMethods;
