import logger from "../../utils/logger";
import { ttnApplicationAPI, ttnDataAPI } from "../../ttn-app";

var controller = {};

// like middleware that will interecept routes with :id
controller.param = async (req, res, next, id) => {
  var ttnDevice = await ttnApplicationAPI.getDevice(id).catch(err => next(err));
  if (!ttnDevice) {
    next(new Error("No TTN device with that id.."));
  } else {
    req.device = ttnDevice;
    next();
  }
};

controller.get = async (req, res, next) => {
  let ttnDevices = await ttnApplicationAPI.getDevices().catch(err => next(err));
  if (ttnDevices) res.json(ttnDevices);
};

// controller.post = async (req, res, next) => {
//   var newDevice = req.body;

//   await Device.create(newDevice).then(
//     device => {
//       res.json(device);
//     },
//     err => next(err)
//   );
// };

controller.getById = async (req, res, next) => {
  var device = req.device; // taken from controller.params method
  res.json(device);
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

// controller.deleteById = (req, res, next) => {
//   var device = req.device;
//   device.remove((err, removed) => {
//     if (err) {
//       next(err);
//     } else {
//       res.json(removed);
//     }
//   });
// };

export default controller;
