import mongoose from "mongoose";

var Schema = mongoose.Schema;

var SettingsSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  value: Object
});

export default mongoose.model("settings", SettingsSchema);

/*
Possible:
{
  name:"beehiveDashboard",
  value:{
    devices:[], // ids here
    dataTypes:[
      {
        name:"",
        minValue:0,
        maxValue,10
      }
    ]
  }
}
*/
