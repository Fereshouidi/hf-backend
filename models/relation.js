const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const relationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friend: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    condition: {
        type: String,
        default: 'not friend',
        enum: ['friend', 'pending', 'not friend', 'block']
    }
});

const Relation = mongoose.model('relations', relationSchema);

module.exports = Relation;
