import mongoose from "mongoose";

var Schema = mongoose.Schema;

var AlertSchema = new Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "device",
    required: true
  },
  dataType: String,
  rules: [
    {
      operator: String,
      operatorValue: String,
      selected: Boolean
    }
  ],
  channels: [
    {
      name: String,
      selected: Boolean
    }
  ]
});

export default mongoose.model("alert", AlertSchema);
