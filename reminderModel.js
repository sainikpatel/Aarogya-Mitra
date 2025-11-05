const mongoose = require('mongoose');
const reminderSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    medicineName: { type: String, required: true },
    dosage: { type: String },
    reminderTime: { type: String, required: true },
    isTaken: { type: Boolean, default: false },
    date: { type: String, required: true }
});
module.exports = mongoose.model('Reminder', reminderSchema);