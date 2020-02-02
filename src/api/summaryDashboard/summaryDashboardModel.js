import mongoose from "mongoose";

var Schema = mongoose.Schema;

var SummaryDashboardSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  value: Object
});

export default mongoose.model("summaryDashboard", SummaryDashboardSchema);

/*
Possible:
{
  name:"beehiveDashboard",
  value:{
    periodInPast:24,
    devices:[], // ids here
    dataTypes:[
      {
        name:"",
        minValue:0,
        maxValue:10
      }
    ]
  }
}
*/
