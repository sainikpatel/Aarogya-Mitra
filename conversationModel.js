const mongoose = require('mongoose');
const conversationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
});
module.exports = mongoose.model('Conversation', conversationSchema);