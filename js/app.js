// Глобальные переменные
let currentItemId = null;

// Отображение данных
const loadItem = async (id) => {
    try {
        const item = await getItem(id);
        if (item) {
            document.getElementById('item-id').textContent = item.id;
            document.getElementById('item-title').textContent = item.title;
            document.getElementById('item-description').textContent = item.description;
            document.getElementById('item-updated').textContent = new Date(item.updated).toLocaleString();

            document.getElementById('edit-title').value = item.title;
            document.getElementById('edit-description').value = item.description;

            document.getElementById('item-section').classList.remove('hidden');
            currentItemId = item.id;
        } else {
            // Создаем новый элемент если не найден
            document.getElementById('item-id').textContent = id;
            document.getElementById('item-title').textContent = '';
            document.getElementById('item-description').textContent = '';
            document.getElementById('item-updated').textContent = 'Новая запись';

            document.getElementById('edit-title').value = '';
            document.getElementById('edit-description').value = '';

            document.getElementById('item-section').classList.remove('hidden');
            currentItemId = id;
        }
    } catch (err) {
        alert('Ошибка загрузки: ' + err);
    }
};

const performSearch = async (query) => {
    if (!query.trim()) return;

    try {
        const results = await searchItems(query);
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>Ничего не найдено</p>';
            return;
        }

        results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <p><strong>${item.title}</strong></p>
                <p>Находится на полке: ${item.id}</p>
                <p>${item.description.substring(0, 50)}...</p>
            `;
            div.addEventListener('click', () => loadItem(item.id));
            resultsContainer.appendChild(div);
        });
    } catch (err) {
        console.error('Search error:', err);
    }
};

// Инициализация приложения
window.addEventListener('DOMContentLoaded', async () => {
    // Инициализация БД
    try {
        await initDB();
    } catch (e) {
        alert("Ошибка базы данных: " + e);
    }

    // Инициализация сканера
    initScanner();

    // Инициализация голосового ввода
    initVoiceRecognition();

    // Инициализация Эксопрта и Импорта
    initExportImport();

    // Обработчики событий
    document.getElementById('manual-search').addEventListener('click', () => {
        const id = document.getElementById('shelf-id-input').value;
        if (id) loadItem(id);
    });

    document.getElementById('text-search').addEventListener('click', () => {
        const query = document.getElementById('search-input').value;
        if (query) performSearch(query);
    });

    document.getElementById('voice-search').addEventListener('click', () => { startVoiceSearch('search') });
    document.getElementById('voice-input-title').addEventListener('click', () => { startVoiceSearch('title') });
    document.getElementById('voice-input-description').addEventListener('click', () => { startVoiceSearch('description') });

    document.getElementById('save-item').addEventListener('click', async () => {
        const newTitle = document.getElementById('edit-title').value.trim();
        if (!newTitle) {
            alert("Введите краткое описание!");
            return;
        }

        try {
            const existingItem = await getItem(currentItemId);
            const item = {
                id: currentItemId,
                title: newTitle,
                description: document.getElementById('edit-description').value,
                created: existingItem?.created || new Date().toISOString(),
                updated: new Date().toISOString()
            };

            await saveItem(item);
            loadItem(currentItemId);
        } catch (err) {
            alert("Ошибка сохранения: " + err);
        }
    });

    document.getElementById('delete-item').addEventListener('click', async () => {
        if (confirm('Удалить эту запись?')) {
            try {
                await deleteItem(currentItemId);
                document.getElementById('item-section').classList.add('hidden');
                currentItemId = null;
            } catch (err) {
                alert("Ошибка удаления: " + err);
            }
        }
    });
});

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.error('SW registration failed:', err));
    });
}