import mongoose from "mongoose";

var Schema = mongoose.Schema;

var DeviceSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    select: false
  },
  description: String,
  location: {
    lat: String,
    lng: String,
    accuracy: String,
    description: String
  },
  sendDataDelay: {
    type: Number,
    default: 7000
  },
  isActive: { type: Boolean, default: false },
  isAddedToDashboard: { type: Boolean, default: false }
});

export default mongoose.model("device", DeviceSchema);
