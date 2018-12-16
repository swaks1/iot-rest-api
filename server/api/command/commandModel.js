var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommandSchema = new Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device',
        required: true
    },
    value: [], //this can be any type
    created: {
        type: Date,
        default: Date.now
    },
    executed: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('command', CommandSchema);