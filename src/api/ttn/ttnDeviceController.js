import logger from "../../utils/logger";
import { ttnApplicationAPI } from "../../ttn-app";

var controller = {};

// like middleware that will interecept routes with :id
controller.param = async (req, res, next, id) => {
  ttnApplicationAPI
    .getDevice(id)
    .then(ttnDevice => {
      req.device = ttnDevice;
      next();
    })
    .catch(err => next(err));
};

controller.get = async (req, res, next) => {
  let ttnDevices = await ttnApplicationAPI.getDevices().catch(err => next(err));
  if (ttnDevices) res.json(ttnDevices);
};

controller.post = async (req, res, next) => {
  let device = req.body;

  try {
    var existingDevice = await ttnApplicationAPI.getDevice(device.devId);
    if (existingDevice) {
      res.status(400).send("Device already exists !");
      return;
    }
  } catch (error) {
    logger.log(error);
  }

  try {
    await ttnApplicationAPI.saveDevice(device);
  } catch (error) {
    res.status(400).send(error.details);
    return;
  }

  ttnApplicationAPI
    .getDevice(device.devId)
    .then(savedDevice => {
      res.json(savedDevice);
    })
    .catch(err => next(err));
};

controller.getById = async (req, res, next) => {
  var device = req.device; // taken from controller.params method
  res.json(device);
};

controller.deleteById = (req, res, next) => {
  var device = req.device;

  ttnApplicationAPI
    .deleteDevice(device.devId)
    .then(item => {
      res.status(200).send(`Successfuly deleted ${device.devId}`);
    })
    .catch(err => next(err));
};

controller.getApplicationInfo = (req, res, next) => {
  ttnApplicationAPI
    .getApplicationInfo()
    .then(ttnAppinfo => {
      res.json(ttnAppinfo);
    })
    .catch(err => next(err));
};

// controller.putById = async (req, res, next) => {
//   var device = req.device;
//   var update = req.body;

//   delete update.name;
//   delete update.password;
//   delete update._id;

//   _.merge(device, update);

//   await device.save((err, saved) => {
//     if (err) {
//       next(err);
//     } else {
//       res.json(saved);
//     }
//   });
// };

export default controller;
