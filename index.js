const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const Reminder = require('./models/reminderModel');

// Import Routes
const prescriptionRoutes = require('./routes/prescriptions');
const chatRoutes = require('./routes/chat');
const reminderRoutes = require('./routes/reminders');
const firstAidRoutes = require('./routes/firstAid');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => console.error('🔥 MongoDB connection error:', err));

// API Route Handlers
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/first-aid', firstAidRoutes);

// Health check
app.get('/', (req, res) => res.send('Arogya Mitra Backend is running!'));

// Background Reminder Scheduler
console.log('🕒 Cron job for reminders scheduled.');
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().substring(0, 5);

        const dueReminders = await Reminder.find({ date: today, reminderTime: currentTime, isTaken: false });

        for (const reminder of dueReminders) {
            console.log(`⏰ Sending reminder for ${reminder.medicineName} to user ${reminder.userId}`);
        }
    } catch (error) {
        console.error('Error in reminder cron job:', error);
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));