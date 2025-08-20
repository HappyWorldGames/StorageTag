// Голосовой ввод
let recognizer = null;
let recSelected = null;

const initVoiceRecognition = () => {
    if (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognizer = new SpeechRecognition();
        recognizer.lang = 'ru-RU';
        recognizer.continuous = false;

        recognizer.onstart = () => {
            switch(recSelected) {
                case 'search':
                    document.getElementById('voice-indicator').classList.add('active-voice');
                    break;
                case 'title':
                    document.getElementById('voice-indicator-title').classList.add('active-voice');
                    break;
                case 'description':
                    document.getElementById('voice-indicator-description').classList.add('active-voice');
                    break;
            }
        };

        recognizer.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            switch(recSelected) {
                case 'search':
                    document.getElementById('search-input').value = transcript;
                    performSearch(transcript);
                    break;
                case 'title':
                    document.getElementById('edit-title').value += transcript;
                    break;
                case 'description':
                    document.getElementById('edit-description').value += transcript;
                    break;
            }
        };

        recognizer.onend = () => {
            switch(recSelected) {
                case 'search':
                    document.getElementById('voice-indicator').classList.remove('active-voice');
                    break;
                case 'title':
                    document.getElementById('voice-indicator-title').classList.remove('active-voice');
                    break;
                case 'description':
                    document.getElementById('voice-indicator-description').classList.remove('active-voice');
                    break;
            }
        };

        recognizer.onerror = (event) => {
            console.error('Speech recognition error', event.error);
        };
    }
};

const startVoiceSearch = async (select) => {
    if (!recognizer) {
        alert("Голосовой ввод не поддерживается в вашем браузере");
        return;
    }

    try {
        // Явный запрос разрешения для Android
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(track => track.stop());
        recSelected = select;
        recognizer.start();
    } catch (err) {
        alert("Разрешите доступ к микрофону в настройках браузера");
    }
};