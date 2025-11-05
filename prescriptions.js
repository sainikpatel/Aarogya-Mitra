const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const Prescription = require('../models/prescriptionModel');

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @route   POST /
 * @desc    Process a prescription IMAGE, get an AI plan, and save it.
 */
router.post('/', upload.single('prescriptionImage'), async (req, res) => {
    try {
        console.log("--- New Prescription Image Request Received ---");
        const { userId, targetLanguage } = req.body;

        if (!req.file || !userId || !targetLanguage) {
            return res.status(400).json({ error: 'Image, userId, and targetLanguage are required.' });
        }

        // --- Step 1: OCR Processing ---
        console.log("1. Preparing image and sending to OCR.space (timeout in 25s)...");
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const params = new URLSearchParams();
        params.append('base64Image', base64Image);
        params.append('apikey', process.env.OCR_SPACE_API_KEY);
        params.append('language', 'eng');

        const ocrResponse = await axios.post('https://api.ocr.space/parse/image', params, {
            timeout: 25000 // 25-second timeout
        });
        console.log("2. OCR response received.");

        if (ocrResponse.data.IsErroredOnProcessing || !ocrResponse.data.ParsedResults || ocrResponse.data.ParsedResults.length === 0) {
            console.error("OCR Error:", ocrResponse.data.ErrorMessage?.join('\n') || 'No parsed results.');
            throw new Error("The OCR service could not read the image. It might be blurry or empty.");
        }
        
        const prescriptionText = ocrResponse.data.ParsedResults[0].ParsedText;
        console.log("3. Extracted Text:", prescriptionText.substring(0, 70) + "...");

        // --- Step 2: AI Processing ---
        console.log("4. Sending text to Groq AI for analysis...");
        const languageName = targetLanguage.toLowerCase() === 'telugu' ? 'Telugu' : (targetLanguage.toLowerCase() === 'hindi' ? 'Hindi' : 'English');
        const systemPrompt =`
        **CRITICAL INSTRUCTION: All text in your response MUST be in the ${languageName} language and written in its native script (e.g., Devanagari for Hindi).**
        For example, for Hindi, instead of 'Namaste', you MUST write 'नमस्ते'. Do not use Roman/English characters for ${languageName} words, except for medicine names which should remain in English.
    
        You are 'Arogya Mitra,' a helpful AI health assistant. Analyze the following prescription text.
        Your task is to return ONLY a valid JSON object. Do not add any text before or after the JSON.
        The JSON must have this exact structure:
        {
          "medicines": [{"name": "Medicine Name and Dosage in English", "purpose": "...", "schedule": "...", "side_effects": "..."}],
          "lifestyleAdvice": ["..."]
        }`;
        
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prescriptionText }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } });
        
        console.log("5. AI response received.");
        const aiResponseJson = JSON.parse(groqResponse.data.choices[0].message.content);

        // --- Step 3: Save to Database ---
        console.log("6. Saving result to database...");
        const newPrescription = new Prescription({ userId, originalText: prescriptionText, medicines: aiResponseJson.medicines, lifestyleAdvice: aiResponseJson.lifestyleAdvice });
        const savedPrescription = await newPrescription.save();
        
        console.log("7. Process complete.");
        res.status(201).json(savedPrescription);

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error("Request timed out. The ocr.space service is likely busy or down.");
            return res.status(504).json({ error: "The OCR server is not responding. Please try again with a clearer image." });
        }
        console.error("Error in prescription processing:", error.message);
        res.status(500).json({ error: error.message || "An internal server error occurred." });
    }
});

// GET route remains the same
router.get('/:userId', async (req, res) => {
    // ... your existing GET logic for prescriptions...
});

module.exports = router;