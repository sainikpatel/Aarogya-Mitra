const express = require('express');
const router = express.Router();
const axios = require('axios');
const Conversation = require('../models/conversationModel');
const Prescription = require('../models/prescriptionModel');

router.post('/', async (req, res) => {
    try {
        const { userId, message } = req.body;
        const latestPrescription = await Prescription.findOne({ userId }).sort({ createdAt: -1 });
        let context = "The user has no prescription history.";
        if (latestPrescription) {
            context = `User's latest prescription: Medicines: ${latestPrescription.medicines.map(m => m.name).join(', ')}. Advice: ${latestPrescription.lifestyleAdvice.join(' ')}`;
        }
        const systemPrompt = `
    You are 'Arogya Mitra,' a helpful and empathetic health assistant.
    **CRITICAL INSTRUCTION: Your entire reply MUST be in the selected user language and written in its native script (e.g., Devanagari for Hindi).**
    For example, for Hindi, instead of 'Namaste', you MUST write 'नमस्ते'. Do not use Roman/English characters for Hindi/Telugu words.

    CONTEXT: ${context}.
    Answer the user's question based on this context if relevant. If the question is outside this context, provide a general, safe answer.
    Always encourage consulting a doctor for serious issues.`;
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
            temperature: 0.7
        }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } });
        const aiResponse = groqResponse.data.choices[0].message.content;
        await Conversation.findOneAndUpdate({ userId }, { $push: { messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiResponse }] } }, { upsert: true });
        res.status(200).json({ reply: aiResponse });
    } catch (error) {
        res.status(500).json({ error: "An internal server error occurred." });
    }
});
module.exports = router;