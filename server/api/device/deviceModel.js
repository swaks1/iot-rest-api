var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeviceSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    password:{
        type:String,
        select : false
    },
    description: String,
    location: {
        lat: String,
        lng: String,
        accuracy:String,
        description: String
    }
});

module.exports = mongoose.model('device', DeviceSchema);