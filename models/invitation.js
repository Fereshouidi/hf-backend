const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
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
        default: 'pending',
        enum: ['pending', 'accepted', 'rejected']
    }
});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
