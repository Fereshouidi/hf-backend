const mongoose = require('mongoose');
const { isNumberObject } = require('util/types');


const userShema = new mongoose.Schema({
    userName: {
        type: String,
    },
    email: {
        type: String,
    },
    birthDate: {
        type: Date,
    },
    age: {
        type: Number,
    },
    password: {
        type: String
    },
    phone: {
        type: Number
    },
    phoCover: {
        type: String,
    },
    phoProfile: {
        type: String,
    },
    discription: {
        type: String,
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'user'
    },
    friends: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'relation',
    },
    invitationSend: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'invitation'
    },
    invitationReceive: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'invitation'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

const user = mongoose.model('User',userShema);
module.exports = user;