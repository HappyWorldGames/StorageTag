// Работа с камерой
let scannerActive = false;
let cameraStream = null;

const initScanner = () => {
    scanButton = document.getElementById('toggle-scan');
    scanButton.addEventListener('click', toggleScanner);
};

const toggleScanner = async () => {
    if (scannerActive) {
        stopScanner();
    } else {
        await startScanner();
    }
};

const startScanner = async () => {
    const video = document.getElementById('camera-preview');
    video.classList.remove('hidden');

    try {
        // Пробуем заднюю камеру, если не получится - любую доступную
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = cameraStream;
        video.play();  // Явный запуск для Android

        // Обработка для устройств, где autoplay не работает
        video.onloadedmetadata = () => video.play();

        scannerActive = true;
        updateScanButton();
        scanBarcode(video);
    } catch (err) {
        alert(`Ошибка камеры: ${err.name || err.message}`);
        console.error("Camera error:", err);
        const manualFallback = confirm("Использовать ручной ввод?");
        if (manualFallback) document.getElementById('shelf-id-input').focus();
    }
};

const stopScanner = () => {
    const video = document.getElementById('camera-preview');
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    video.classList.add('hidden');
    scannerActive = false;
    updateScanButton();
};

const updateScanButton = () => {
    if (scannerActive) {
        scanButton.textContent = 'Остановить сканирование';
        scanButton.classList.add('active-scan');
    } else {
        scanButton.textContent = 'Запустить сканер';
        scanButton.classList.remove('active-scan');
    }
};

const scanBarcode = (video) => {
    if (!scannerActive) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Используем jsQR для декодирования
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                const itemId = code.data;
                stopScanner();
                loadItem(itemId);
            }
        }
    }

    if (scannerActive) {
        requestAnimationFrame(() => scanBarcode(video));
    }
};