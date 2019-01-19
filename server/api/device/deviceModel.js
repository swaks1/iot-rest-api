var mongoose = require('mongoose');
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
    isActive: { type: Boolean, default: false },
    isAddedToDashboard: { type: Boolean, default: false }
});

module.exports = mongoose.model('device', DeviceSchema);