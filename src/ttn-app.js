import config from "./config";
import logger from "./utils/logger";
import helper from "./utils/helper";
import { data as DataTTN, application as AppTTN, key } from "ttn";
import Device from "./api/device/deviceModel";
import Data from "./api/data/dataModel";

var dataClient = null;
var applicationClient = null;
var euis = null;

export const startTTN = async () => {
  const appID = config.ttnAppId;
  const accessKey = config.ttnAccessKey;

  // mqqt client
  dataClient = await DataTTN(appID, accessKey);
  dataClient.on("uplink", function(devID, payload) {
    logger.log(devID, payload);
    saveData(devID, payload);
  });

  // application manager client
  applicationClient = await AppTTN(appID, accessKey);
  euis = await applicationClient.getEUIs();
  const app = await applicationClient.get();
  logger.log("Got app", app);

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

var ttnApplicationMethods = {};

ttnApplicationMethods.getDevices = async () => {
  return applicationClient.devices();
};

ttnApplicationMethods.getDevice = async devId => {
  return applicationClient.device(devId);
};

ttnApplicationMethods.saveDevice = async ttnDevice => {
  return applicationClient.registerDevice(ttnDevice.devId, {
    activation_constraints: ttnDevice.activation,
    description: ttnDevice.description,
    appEui: euis[0],
    devEui: helper.getRandomHexString(8) + helper.getRandomHexString(8), // 16 character long hex format
    devAddr: "2601" + helper.getRandomHexString(4),
    nwkSKey: key(16),
    appSKey: key(16),
    appKey: key(16)
  });
};

ttnApplicationMethods.deleteDevice = async devId => {
  return applicationClient.deleteDevice(devId);
};

var ttnDataMethods = {};

ttnDataMethods.sendUplink = async (
  devId,
  hexDataArray,
  port = 1,
  confirmed = false
) => {
  dataClient.send(devId, Buffer.from(hexDataArray), port, confirmed);
};

export const ttnApplicationAPI = ttnApplicationMethods;
export const ttnDataAPI = ttnDataMethods;
