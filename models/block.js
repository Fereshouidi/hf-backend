const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blockSchema = new Schema({
    blocker: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blocked: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Block = mongoose.model('Block', blockSchema);

module.exports = Block;