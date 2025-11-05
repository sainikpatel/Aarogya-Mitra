document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sections = document.querySelectorAll('section.block');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const languageSelector = document.getElementById('languageSelector');
    const prescriptionResultDiv = document.getElementById('prescriptionResult');

    const reminderForm = document.getElementById('reminderForm');
    const remindersListDiv = document.getElementById('remindersList');

    const firstAidCasesDiv = document.getElementById('firstAidCases');
    const firstAidInstructionsDiv = document.getElementById('firstAidInstructions');

    const chatAvatar = document.getElementById('chatAvatar');
    const chatBubble = document.getElementById('chatBubble');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatHistoryDiv = document.getElementById('chatHistory');
    const chatDefaultMsg = document.getElementById('chatDefaultMsg');
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const notificationBanner = document.getElementById('notificationBanner');

    // --- API Configuration ---
    const API_BASE_URL = 'http://localhost:3001/api';
    let userId = 'user_' + Date.now();

    // --- Text-to-Speech Function ---
    function speakText(text, lang = 'english') {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            const langCode = { 'english': 'en-US', 'hindi': 'hi-IN', 'telugu': 'te-IN' }[lang];
            utterance.lang = langCode;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Sorry, your browser does not support text-to-speech.");
        }
    }

    // --- Page Navigation ---
    window.showSection = (sectionId) => {
        sections.forEach(section => section.classList.toggle('visible', section.id === sectionId));
        if (sectionId === 'reminders') loadReminders();
        if (sectionId === 'firstaid') loadFirstAidCases();
    };

    darkModeToggle.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

    // --- Prescription Upload ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('prescriptionImage', file);
        formData.append('targetLanguage', languageSelector.value);
        formData.append('userId', userId);
        prescriptionResultDiv.innerHTML = `<p>Processing... Please wait.</p>`;
        try {
            const response = await fetch(`${API_BASE_URL}/prescriptions`, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error`);
            }
            const data = await response.json();
            displayPrescription(data);
        } catch (error) {
            prescriptionResultDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    });

    // --- THIS IS THE UPDATED FUNCTION ---
    function displayPrescription(data) {
        prescriptionResultDiv.innerHTML = '';
        let fullTextToRead = "Here is your prescription summary. ";
        
        data.medicines.forEach(med => {
            // Reconstruct the text for the read-aloud feature
            fullTextToRead += `Medicine: ${med.name}. Purpose: ${med.purpose}. Schedule: ${med.schedule}. Side Effects: ${med.side_effects}. `;
            
            const card = document.createElement('div');
            card.className = 'medicine-card';
            
            // Build a structured HTML layout for better display
            card.innerHTML = `
                <h3>${med.name}</h3>
                <p><strong>Purpose:</strong> ${med.purpose}</p>
                <p><strong>Schedule:</strong> ${med.schedule}</p>
                <p><strong>Side Effects:</strong> ${med.side_effects}</p>
            `;
            prescriptionResultDiv.appendChild(card);
        });

        if (data.lifestyleAdvice && data.lifestyleAdvice.length > 0) {
            const adviceText = `Lifestyle Advice: ${data.lifestyleAdvice.join(', ')}.`;
            fullTextToRead += adviceText;
            const adviceCard = document.createElement('div');
            adviceCard.className = 'advice-card';
            adviceCard.innerHTML = `<h3>Lifestyle Advice</h3><ul>${data.lifestyleAdvice.map(item => `<li>${item}</li>`).join('')}</ul>`;
            prescriptionResultDiv.appendChild(adviceCard);
        }

        const listenButton = document.createElement('button');
        listenButton.className = 'btn-primary';
        listenButton.style.marginTop = '15px';
        listenButton.textContent = '🔊 Listen to Full Plan';
        listenButton.onclick = () => speakText(fullTextToRead, languageSelector.value);
        prescriptionResultDiv.appendChild(listenButton);
    }

    // --- Reminders ---
    reminderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch(`${API_BASE_URL}/reminders`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, medicineName: document.getElementById('medName').value, dosage: document.getElementById('medDosage').value, reminderTime: document.getElementById('medTime').value, date: new Date().toISOString().split('T')[0] })
        });
        reminderForm.reset();
        loadReminders();
    });

    async function loadReminders() {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`${API_BASE_URL}/reminders/${userId}/${today}`);
        const reminders = await res.json();
        remindersListDiv.innerHTML = reminders.length === 0 ? '<p>No reminders set for today.</p>' : '';
        reminders.forEach(r => {
            const item = document.createElement('div');
            item.className = 'reminder-item';
            item.innerHTML = `<div><strong>💊 ${r.medicineName}</strong><p>⏰ ${r.reminderTime} - ${r.isTaken ? 'Taken' : 'Pending'}</p></div> ${!r.isTaken ? `<button class="btn-primary" onclick="markAsTaken('${r._id}')">Take</button>` : ''}`;
            remindersListDiv.appendChild(item);
        });
    }
    window.markAsTaken = async (id) => { await fetch(`${API_BASE_URL}/reminders/${id}/taken`, { method: 'PUT' }); loadReminders(); };

    // --- First-Aid ---
    async function loadFirstAidCases() {
        const caseImages = {
            'snake_bite': 'https://acko-cms.s3.ap-south-1.amazonaws.com/large_first_aid_snake_bites_cc5e6af978.png',
            'heart_attack': 'https://starhospitalsproduction.s3.amazonaws.com/6850dWISCg0BzPDp4ipPaQhoJHxi6X5URxs9olAV.jpg',
            'bleeding': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp4VyE-YOJRwL-DeHkrRwnpNH1llfYNZlF9A&s',
            'burns': 'https://www.firstaidpro.com.au/wp-content/uploads/2025/05/burn-skin.jpeg',
            'stroke': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQssIqRUktWv7v0WNkxzNRJGyLgMrNgBNUtkQ&s'
        };
        try {
            const response = await fetch(`${API_BASE_URL}/first-aid`);
            const cases = await response.json();
            firstAidCasesDiv.innerHTML = '';
            cases.forEach(c => {
                const card = document.createElement('div');
                card.className = 'small-card';
                card.onclick = () => loadFirstAidInstructions(c.case);
                const imageUrl = caseImages[c.case] || 'https://i.ibb.co/Yd4B3t5/first-aid-kit.png';
                card.innerHTML = `<img src="${imageUrl}" alt="${c.title}" class="first-aid-icon"><span>${c.title}</span>`;
                firstAidCasesDiv.appendChild(card);
            });
        } catch (error) {
            firstAidCasesDiv.innerHTML = "<p>Could not load emergency guides.</p>";
        }
    }

    async function loadFirstAidInstructions(caseName) {
        const response = await fetch(`${API_BASE_URL}/first-aid/${caseName}`);
        const data = await response.json();
        firstAidInstructionsDiv.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'instruction-card';
        let fullTextToRead = `First aid for ${data.title}. `;
        const instructionList = data.instructions.map(inst => {
            fullTextToRead += `Step ${inst.step}: ${inst.description}. `;
            return `<li>${inst.description}</li>`;
        }).join('');
        card.innerHTML = `<h3>${data.title} <button class="listen-btn" onclick="speakText('${fullTextToRead.replace(/'/g, "\\'")}', 'english')">🔊</button></h3><ol>${instructionList}</ol>`;
        firstAidInstructionsDiv.appendChild(card);
    }

    // --- Chat Assistant ---
    chatAvatar.addEventListener('click', () => chatBubble.classList.toggle('show'));
    sendChatBtn.addEventListener('click', handleChatMessage);
    chatInput.addEventListener('keyup', e => e.key === 'Enter' && handleChatMessage());
    async function handleChatMessage() {
        const message = chatInput.value;
        if (!message.trim()) return;
        chatDefaultMsg.style.display = 'none';
        appendChatMessage(message, 'user');
        chatInput.value = '';
        const res = await fetch(`${API_BASE_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, message }) });
        const data = await res.json();
        speakText(data.reply, languageSelector.value);
        appendChatMessage(data.reply, 'assistant');
    }
    function appendChatMessage(text, role) {
        const div = document.createElement('div');
        div.className = `chat-message ${role}-message`;
        div.textContent = text;
        chatHistoryDiv.appendChild(div);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }

    // --- Reminder Notification Checker ---
    setInterval(async () => {
        const now = new Date();
        const res = await fetch(`${API_BASE_URL}/reminders/${userId}/${now.toISOString().split('T')[0]}`);
        const reminders = await res.json();
        const due = reminders.find(r => r.reminderTime === now.toTimeString().substring(0, 5) && !r.isTaken);
        if (due) {
            const text = `Reminder: Time to take your ${due.medicineName}.`;
            notificationBanner.textContent = `🔔 ${text}`;
            notificationBanner.classList.add('show');
            speakText(text, languageSelector.value);
            setTimeout(() => notificationBanner.classList.remove('show'), 10000);
        }
    }, 30000);

    // --- Initial Load ---
    showSection('home');
    window.speakText = speakText;
});

