const mongoose = require('mongoose');
const prescriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    originalText: { type: String },
    medicines: [{ name: String, purpose: String, schedule: String, side_effects: String }],
    lifestyleAdvice: [String],
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Prescription', prescriptionSchema);