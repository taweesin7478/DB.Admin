const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    user: { type: String, default: '' },
    password: { type: String, default: '' },
    No_limit: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now() },
}, { collection: 'Admin' })

module.exports = mongoose.model('Admin', Schema)