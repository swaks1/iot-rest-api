import mongoose from "mongoose";

var Schema = mongoose.Schema;

var AlertHistorySchema = new Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "device",
    required: true
  },
  dataType: String,
  data: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "data",
    required: true
  },
  rulesTriggered: [
    {
      operator: String,
      operatorValue: String,
      actualValue: String,
      created: {
        type: Date,
        default: Date.now
      }
    }
  ],
  channels: [],
  created: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("alertHistory", AlertHistorySchema);
