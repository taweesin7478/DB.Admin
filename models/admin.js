const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    user: { type: String, default: '' },
    password: { type: String, default: '' },
    created_at: { type: String, default: '' },
}, { collection: 'Admin' })

module.exports = mongoose.model('Admin', Schema)