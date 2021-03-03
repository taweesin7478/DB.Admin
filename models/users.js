const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    // id : { type:String,unique: true,min: 1 },
    username: { type: String, default: '', unique: true },
    email: { type: String, unique: true, default: '', required: true, unique: true },
    name: { type: String, default: '', required: true },
    lastname: { type: String, default: '', required: true },
    phonenumber: { type: String, default: '', minlength: 10, maxlength: 10, },
    company: { type: String, default: '', required: true },
    oneid: { type: String, default: null, unique: true },
    room_id: { type: String, default: '', required: true, },
    role: { type: String, default: '' },
    avatar_profile: { type: String, default: null, },
    verifyemail: { type: Boolean, default: false },
    license: { type: Date, default: null },
    limit: { type: Number, default: 0 },
    disable: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
}, { collection: 'Users' })

module.exports = mongoose.model('Users', Schema)