let currentLanguage = 'en';

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateDateTime();
    updateCurrentMonthHolidays();
    setupEventListeners();
    setInterval(updateDateTime, 1000);
});

function loadSettings() {
    chrome.storage.local.get(['language', 'background'], (result) => {
        try {
            if (result.language) {
                currentLanguage = result.language;
                document.getElementById('language-select').value = currentLanguage;
            }
            if (result.background) {
                const bgOption = document.querySelector(`[data-bg="${result.background}"]`);
                if (bgOption) {
                    bgOption.classList.add('selected');
                    document.querySelector('.container').style.backgroundImage = 
                        `url('images/backgrounds/${result.background}.jpg')`;
                }
            }
            updateLanguage();
        } catch (error) {
            console.error('Error loading settings:', error);
            // Set defaults if there's an error
            currentLanguage = 'en';
            updateLanguage();
        }
    });
}

function updateDateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    timeElement.textContent = now.toLocaleTimeString(getLocale());
    dateElement.textContent = now.toLocaleDateString(getLocale(), {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateCurrentMonthHolidays() {
    const holidaysList = document.getElementById('holidays-list');
    holidaysList.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const currentMonth = new Date().getMonth();
        const currentMonthHolidays = holidays2025.filter(holiday => {
            const holidayMonth = new Date(holiday.date).getMonth();
            return holidayMonth === currentMonth;
        });

        holidaysList.innerHTML = '';
        if (currentMonthHolidays.length === 0) {
            holidaysList.innerHTML = '<div class="no-holidays">No holidays this month</div>';
            return;
        }

        currentMonthHolidays.forEach(holiday => {
            const holidayDiv = document.createElement('div');
            holidayDiv.className = 'holiday-item';
            const date = new Date(holiday.date);
            holidayDiv.textContent = `${date.getDate()} ${months[currentLanguage][date.getMonth()]} - ${holiday.name[currentLanguage]}`;
            holidaysList.appendChild(holidayDiv);
        });
    } catch (error) {
        console.error('Error updating holidays:', error);
        holidaysList.innerHTML = '<div class="error">Error loading holidays</div>';
    }
}

function setupEventListeners() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsBtn = document.getElementById('close-settings');
    const overlay = document.querySelector('.overlay');
    const languageSelect = document.getElementById('language-select');
    const bgOptions = document.querySelectorAll('.bg-option');

    // Open settings
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('hidden');
        overlay.classList.add('show');
    });

    // Close settings
    function closeSettings() {
        settingsPanel.classList.add('hidden');
        overlay.classList.remove('show');
    }

    closeSettingsBtn.addEventListener('click', closeSettings);
    overlay.addEventListener('click', closeSettings);

    // Prevent clicks inside settings panel from closing it
    settingsPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        chrome.storage.local.set({ language: currentLanguage });
        updateLanguage();
        updateCurrentMonthHolidays();
    });

    // Background image selection
    bgOptions.forEach(option => {
        option.addEventListener('click', () => {
            const bgName = option.getAttribute('data-bg');
            // Remove selected class from all options
            bgOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            // Set background
            document.querySelector('.container').style.backgroundImage = 
                `url('images/backgrounds/${bgName}.jpg')`;
            // Save preference
            chrome.storage.local.set({ background: bgName });
        });
    });
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-' + currentLanguage + ']');
    elements.forEach(element => {
        element.textContent = element.getAttribute('data-' + currentLanguage);
    });
}

function getLocale() {
    const locales = {
        'en': 'en-US',
        'si': 'si-LK',
        'ta': 'ta-LK'
    };
    return locales[currentLanguage] || 'en-US';
} 