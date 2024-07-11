const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const presetRoles = ['Buyer', 'Tenant', 'Owner', 'User', 'Admin', 'Content Creator'];

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    // role: {
    //     type: String,
    //     required: true,
    //     enum: presetRoles// Ensure the role is one of the preset roles
    // },
    token:{
        type:String,
        default:''
    }
});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;

