import mongoose from "mongoose";
import { CHANNEL } from "../../utils/constants";
var Schema = mongoose.Schema;

var CommandSchema = new Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "device",
      required: true
    },
    commandItem: {
      commandValue: String,
      commandType: String
    },
    created: {
      type: Date,
      default: Date.now
    },
    executed: {
      type: Boolean,
      default: false
    },
    channel: {
      type: String,
      default: CHANNEL.WIFI
    },
    pseudoId: {
      type: Number,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("command", CommandSchema);
