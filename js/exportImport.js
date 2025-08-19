// === Функции экспорта/импорта ===
const initExportImport = () => {
    // Обработчики для экспорта/импорта
    document.getElementById('export-data').addEventListener('click', showExportResult);

    document.getElementById('import-data').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileImport(e.target.files[0]);
        }
    });

    document.getElementById('copy-json').addEventListener('click', () => {
        const jsonText = document.getElementById('export-preview').textContent;
        navigator.clipboard.writeText(jsonText)
            .then(() => showNotification('Данные скопированы в буфер обмена', 'success'))
            .catch(() => showNotification('Не удалось скопировать данные', 'error'));
    });

    document.getElementById('share-as-file').addEventListener('click', () => {
        const jsonText = document.getElementById('export-preview').textContent;
        const date = new Date().toISOString().slice(0, 10);
        downloadJSONFile(jsonText, `storagetag-backup-${date}.json`);
        showNotification('Файл успешно скачан', 'success');
    });

    document.getElementById('generate-qr-share').addEventListener('click', () => {
        const jsonText = document.getElementById('export-preview').textContent;
        // Для QR-кода используем сжатую версию данных (без форматирования)
        const compressedData = JSON.stringify(JSON.parse(jsonText));
        generateQRCode(compressedData);
    });

    document.getElementById('confirm-import').addEventListener('click', confirmImport);

    document.getElementById('cancel-import').addEventListener('click', () => {
        document.getElementById('import-result').classList.add('hidden');
        document.getElementById('import-file').value = '';
        window.importDataToConfirm = null;
    });

    document.getElementById('close-qr').addEventListener('click', () => {
        document.getElementById('qr-container').classList.add('hidden');
    });
};

const exportAllData = async () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                items: request.result
            };
            resolve(data);
        };

        request.onerror = () => reject(request.error);
    });
};

const importData = async (data) => {
    // Проверяем формат данных
    if (!data || !data.items || !Array.isArray(data.items)) {
        throw new Error('Неверный формат данных');
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Импортируем все элементы
    for (const item of data.items) {
        // Проверяем, что элемент имеет правильную структуру
        if (item.id && item.title) {
            // Обновляем дату изменения при импорте
            item.updated = new Date().toISOString();
            // Если это новая запись, устанавливаем дату создания
            if (!item.created) {
                item.created = new Date().toISOString();
            }
            store.put(item);
        }
    }

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(data.items.length);
        transaction.onerror = () => reject(transaction.error);
    });
};

const showExportResult = async () => {
    try {
        const data = await exportAllData();
        const jsonString = JSON.stringify(data, null, 2);

        document.getElementById('export-preview').textContent = jsonString;
        document.getElementById('export-result').classList.remove('hidden');

        // Прокручиваем к результатам экспорта
        document.getElementById('export-result').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showNotification('Ошибка экспорта: ' + error.message, 'error');
    }
};

const handleFileImport = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Проверяем валидность данных
            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Неверный формат файла');
            }

            // Показываем предпросмотр
            document.getElementById('import-preview').textContent = JSON.stringify(data, null, 2);
            document.getElementById('import-count').textContent = data.items.length;
            document.getElementById('import-result').classList.remove('hidden');

            // Сохраняем данные для импорта
            window.importDataToConfirm = data;

            // Прокручиваем к результатам импорта
            document.getElementById('import-result').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            showNotification('Ошибка чтения файла: ' + error.message, 'error');
        }
    };

    reader.onerror = () => {
        showNotification('Ошибка чтения файла', 'error');
    };

    reader.readAsText(file);
};

const confirmImport = async () => {
    if (!window.importDataToConfirm) return;

    try {
        const importedCount = await importData(window.importDataToConfirm);
        showNotification(`Успешно импортировано ${importedCount} записей`, 'success');

        // Сбрасываем состояние
        document.getElementById('import-result').classList.add('hidden');
        document.getElementById('import-file').value = '';
        window.importDataToConfirm = null;

    } catch (error) {
        showNotification('Ошибка импорта: ' + error.message, 'error');
    }
};

const generateQRCode = (text) => {
    const canvas = document.getElementById('qr-canvas');
    const container = document.getElementById('qr-container');

    // Очищаем предыдущий QR
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Используем jsQR для генерации
    const qrSize = 200;
    canvas.width = qrSize;
    canvas.height = qrSize;

    // Создаем QR code
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();

    // Рисуем QR
    const cellSize = qrSize / qr.getModuleCount();
    for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
            ctx.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }

    container.classList.remove('hidden');
};

const downloadJSONFile = (data, filename) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'storagetag-data.json';
    document.body.appendChild(a);
    a.click();

    // Очистка
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
};