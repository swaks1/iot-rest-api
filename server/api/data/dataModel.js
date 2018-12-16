var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DataSchema = new Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device',
        required: true
    },
    dataItem: {
        dataValue: String,
        dataType : String,
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('data', DataSchema);