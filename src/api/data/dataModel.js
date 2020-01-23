import mongoose from "mongoose";
import { CHANNEL } from "../../utils/constants";

var Schema = mongoose.Schema;

var DataSchema = new Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "device",
    required: true
  },
  dataItem: {
    dataValue: String,
    dataType: String
  },
  created: {
    type: Date,
    default: Date.now
  },
  channel: {
    type: String,
    default: CHANNEL.WIFI
  }
});

export default mongoose.model("data", DataSchema);
