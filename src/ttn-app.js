import config from "./config";
import logger from "./utils/logger";
import { data, application } from "ttn";
import Device from "./api/device/deviceModel";
import Data from "./api/data/dataModel";

export const startTTN = async () => {
  const appID = config.ttnAppId;
  const accessKey = config.ttnAccessKey;

  // discover handler and open mqtt connection
  data(appID, accessKey)
    .then(function(client) {
      client.on("uplink", function(devID, payload) {
        saveData(devID, payload);
        console.log("Received uplink from ", devID);
        console.log(payload);
      });
    })
    .catch(function(err) {
      console.error(err);
      // process.exit(1);
    });

  // discover handler and open application manager client
  application(appID, accessKey)
    .then(function(client) {
      return client.get();
    })
    .then(function(app) {
      console.log("Got app", app);
    })
    .catch(function(err) {
      console.error(err);
      // process.exit(1);
    });

  // var obj = {
  //   app_id: "lorawan_test_app",
  //   dev_id: "lora32u4-abp",
  //   hardware_serial: "A1073293F71AED46",
  //   port: 1,
  //   counter: 19,
  //   payload_fields: { humidity: 56, light: 0.38, temperature: 21.1 },
  //   metadata: {
  //     time: "2019-12-02T19:32:56.120033458Z",
  //     frequency: 868.1,
  //     modulation: "LORA",
  //     data_rate: "SF7BW125",
  //     airtime: 51456000,
  //     coding_rate: "4/5"
  //   }
  // };
  // await saveData("1", obj);
};

var saveData = async (devID, payload) => {
  var existingDevice = await Device.findOne({
    "ttnInfo.dev_id": payload.dev_id
  })
    .lean()
    .exec();

  if (existingDevice != null) {
    logger.log(payload.payload_fields);
    var data = [];

    for (let property in payload.payload_fields) {
      var newData = {
        device: existingDevice._id,
        dataItem: {
          dataType: property,
          dataValue: payload.payload_fields[property]
        },
        communicationMedium: "LORA",
        created: payload.metadata.time
      };
      data.push(newData);
    }
    // logger.log(data);
    await Data.insertMany(data).catch(err => logger.error(err));
  } else {
    logger.log("Device doesn't exist");
  }
};
