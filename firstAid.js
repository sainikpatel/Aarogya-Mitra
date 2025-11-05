const express = require('express');
const router = express.Router();
const FirstAid = require('../models/firstAidModel');

router.get('/', async (req, res) => {
    try {
        const cases = await FirstAid.find({}, 'title case');
        res.status(200).json(cases);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch cases.' }); }
});

router.get('/:case', async (req, res) => {
    try {
        const instructions = await FirstAid.findOne({ case: req.params.case });
        res.status(200).json(instructions);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch instructions.' }); }
});
module.exports = router;