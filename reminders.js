const express = require('express');
const router = express.Router();
const Reminder = require('../models/reminderModel');

router.post('/', async (req, res) => {
    try {
        const newReminder = new Reminder(req.body);
        await newReminder.save();
        res.status(201).json(newReminder);
    } catch (error) { res.status(500).json({ error: 'Failed to create reminder.' }); }
});

router.get('/:userId/:date', async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.params.userId, date: req.params.date }).sort({ reminderTime: 1 });
        res.status(200).json(reminders);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch reminders.' }); }
});

router.put('/:reminderId/taken', async (req, res) => {
    try {
        const updated = await Reminder.findByIdAndUpdate(req.params.reminderId, { isTaken: true }, { new: true });
        res.status(200).json(updated);
    } catch (error) { res.status(500).json({ error: 'Failed to update reminder.' }); }
});
module.exports = router;