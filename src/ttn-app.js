import config from "./config";
import logger from "./utils/logger";
import { data as DataTTN, application as AppTTN, key } from "ttn";
import Device from "./api/device/deviceModel";
import Data from "./api/data/dataModel";

var client = null;
var application = null;
var euis = null;

export const startTTN = async () => {
  const appID = config.ttnAppId;
  const accessKey = config.ttnAccessKey;

  // mqqt client
  client = await DataTTN(appID, accessKey);

  client.on("uplink", function(devID, payload) {
    logger.log(devID, payload);
    saveData(devID, payload);
    // send downlink
    // client.send("airbnb", new Buffer([ 0x0f, 0xaf ]))
  });

  // application manager client
  application = await AppTTN(appID, accessKey);

  euis = await application.getEUIs();
  const app = await application.get();
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

export const GetDevices = async () => {
  return application.devices();
};

export const GetDevice = async devId => {
  return application.device(devId);
};

export const SaveDevice = async (devId, ttnDevice) => {
  return application.registerDevice(devId, {
    description: "Description",
    appEui: euis[0],
    devEui: "9988776655443322",
    devAddr: "11223344",
    nwkSKey: key(16),
    appSKey: key(16),
    appKey: key(16)
  });
};

export const DeleteDevice = async devId => {
  return application.deleteDevice(devId);
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
