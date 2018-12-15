var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var DeviceSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    description: String,
    location: {
        lat: String,
        lng: String,
        description: String
    }
});

module.exports = mongoose.model('device', DeviceSchema);