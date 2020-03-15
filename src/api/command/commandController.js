import Command from "./commandModel";
import Device from "./../device/deviceModel";
import logger from "./../../utils/logger";
import helper from "./../../utils/helper";
import { CHANNEL } from "./../../utils/constants";
import { ttnDataAPI } from "../../ttn-app";
// import _ from "lodash";

var controller = {};

controller.get = async (req, res, next) => {
  let deviceId = req.query.deviceId;
  // logger.log(deviceId);
  if (!deviceId) {
    res.send("add device id");
  } else {
    await Command.find({ device: deviceId })
      // .populate('device')
      .sort("-created")
      .limit(5)
      .exec()
      .then(
        data => {
          let mappedData = helper.fixDates(data, "created");
          res.json(mappedData);
        },
        err => next(err)
      );
  }
};

controller.post = async (req, res, next) => {
  var command = req.body;
  if (command.created) {
    command.created = new Date(command.created);
  }

  if (command.channel.toLowerCase() == CHANNEL.LORAWAN.toLocaleLowerCase()) {
    saveLoraWANCommand(command, res, next);
  } else {
    saveWiFiCommand(command, res, next);
  }
};

controller.getById = async (req, res, next) => {
  var commandId = req.params.id;
  if (!commandId) {
    res.send("add device id");
  } else {
    await Command.findById({ _id: commandId })
      // .populate('device')
      .exec()
      .then(
        data => {
          let dataObj = helper.fixDates(data, "created");
          res.json(dataObj);
        },
        err => next(err)
      );
  }
};

controller.getNotExecutedCommand = async (req, res, next) => {
  var deviceId = req.params.deviceId;
  if (!deviceId) {
    res.send("add device id");
  } else {
    await Command.find({
      device: deviceId,
      executed: false,
      channel: CHANNEL.WIFI
    })
      // .populate('device')
      .sort({ created: "asc" })
      .exec()
      .then(
        data => {
          if (data.length > 0) {
            let firstCommand = helper.fixDates(data[0], "created");
            res.json(firstCommand);
          } else {
            res.status(404).send();
          }
        },
        err => next(err)
      );
  }
};

controller.postExecutedCommand = async (req, res, next) => {
  var commandId = req.body.commandId;
  var isExecuted = req.body.executed;
  // logger.log(req.body);
  await Command.findOne({ _id: commandId }).then(
    item => {
      if (item) {
        item.executed = isExecuted;
        item.save();

        // update what this command meant for the device
        controller.UpdateDeviceFromExecutedCommand(item);

        res.send("OK..SAVED");
      } else {
        res.send("not Found");
      }
    },
    err => next(err)
  );
};

controller.UpdateDeviceFromExecutedCommand = async command => {
  await Device.findById(command.device).then(
    device => {
      if (!device) {
        // next(new Error('No device with that id..'));
        logger.log("No Device with that ID...");
      } else {
        if (command.commandItem.commandType == "IS_ACTIVE") {
          if (command.commandItem.commandValue.toLowerCase() == "true") {
            device.isActive = true;
          } else if (command.commandItem.commandValue.toLowerCase() == "false") {
            device.isActive = false;
          }
        }

        if (command.commandItem.commandType == "SEND_DATA_DELAY") {
          device.sendDataDelay = command.commandItem.commandValue;
        }

        device.save();
      }
    },
    err => logger.error(err)
  );
};

controller.getGoogleApiCert = (req, res, next) => {
  var data = {};
  // google certificate thumbrint for SSL.... https://www.googleapis.com/geolocation/v1/geolocate
  // data.googleCert = [0xD6, 0x73, 0x98, 0x1A, 0x84, 0x96, 0x26, 0xD7, 0xF6, 0x10, 0x5D, 0x97, 0x8F, 0xE7, 0x47, 0x8A, 0x96, 0xB3, 0x46, 0x00]; //vazi do februari
  // data.googleCert = [0xBB, 0x64, 0x14, 0x3F, 0x4B, 0x0D, 0x81, 0xF5, 0xE0, 0xDA, 0xD3, 0x2C, 0x03, 0x80, 0x01, 0x8E, 0xDB, 0x78, 0x1D, 0xEF]; //vazi do april
  data.googleCert = [
    0x95,
    0xa7,
    0x69,
    0x0d,
    0x58,
    0x4a,
    0x35,
    0x57,
    0xb6,
    0x4e,
    0xe1,
    0x72,
    0xe7,
    0xc1,
    0x01,
    0xbd,
    0xca,
    0xa8,
    0xe7,
    0x7a
  ];

  res.json(data);
};

const saveLoraWANCommand = (command, res, next) => {
  Device.findById(command.device)
    .exec()
    .then(iotDevice => {
      if (!iotDevice || !iotDevice.ttnInfo || !iotDevice.ttnInfo.devId) {
        res.status(400).send("TTN DeviceID not found !!");
        return;
      }
      Command.find({ channel: CHANNEL.LORAWAN, device: command.device })
        .sort({ created: -1 })
        .limit(1)
        .exec()
        .then(result => {
          let pseudoId = 1;
          let lastCommand = result.length > 0 ? result[0] : null;
          if (lastCommand && lastCommand.pseudoId && lastCommand.pseudoId < 255) {
            pseudoId = lastCommand.pseudoId + 1;
          }
          command.channel = CHANNEL.LORAWAN;
          command.pseudoId = pseudoId;

          ttnDataAPI
            .sendUplink(iotDevice.ttnInfo.devId, [pseudoId, command.commandItem.commandValue])
            .then(() => {
              Command.create(command)
                .then(item => {
                  let itemObj = helper.fixDates(item, "created");
                  res.send(itemObj);
                })
                .catch(err => next(err));
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

const saveWiFiCommand = (command, res, next) => {
  command.channel = CHANNEL.WIFI;
  Command.create(command)
    .then(item => {
      let itemObj = helper.fixDates(item, "created");
      res.send(itemObj);
    })
    .catch(err => next(err));
};
export default controller;
