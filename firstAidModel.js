const mongoose = require('mongoose');
const firstAidSchema = new mongoose.Schema({
    case: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    instructions: [{ step: Number, description: String }]
});
module.exports = mongoose.model('FirstAid', firstAidSchema);