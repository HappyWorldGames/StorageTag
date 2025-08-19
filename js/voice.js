// Голосовой ввод
let recognizer = null;

const initVoiceRecognition = () => {
    if (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognizer = new SpeechRecognition();
        recognizer.lang = 'ru-RU';
        recognizer.continuous = false;

        recognizer.onstart = () => {
            document.getElementById('voice-indicator').classList.add('active-voice');
        };

        recognizer.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('search-input').value = transcript;
            performSearch(transcript);
        };

        recognizer.onend = () => {
            document.getElementById('voice-indicator').classList.remove('active-voice');
        };

        recognizer.onerror = (event) => {
            console.error('Speech recognition error', event.error);
        };
    }
};

const startVoiceSearch = async () => {
    if (!recognizer) {
        alert("Голосовой ввод не поддерживается в вашем браузере");
        return;
    }

    try {
        // Явный запрос разрешения для Android
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(track => track.stop());
        recognizer.start();
    } catch (err) {
        alert("Разрешите доступ к микрофону в настройках браузера");
    }
};