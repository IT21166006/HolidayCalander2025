// Store notification preferences
let notificationSettings = {
  enabled: true,
  language: 'en'
};

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['notificationSettings'], (result) => {
    if (result.notificationSettings) {
      notificationSettings = result.notificationSettings;
    }
    setupHolidayChecks();
  });
});

// Set up daily checks for holidays
function setupHolidayChecks() {
  // Check every hour
  chrome.alarms.create('holidayCheck', {
    periodInMinutes: 60
  });
}

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'holidayCheck') {
    checkUpcomingHolidays();
  }
});

// Check for upcoming holidays
function checkUpcomingHolidays() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const upcomingHoliday = holidays2025.find(holiday => holiday.date === tomorrowStr);

  if (upcomingHoliday) {
    scheduleNotifications(upcomingHoliday);
  }
}

// Schedule 5 notifications with 5-hour intervals
function scheduleNotifications(holiday) {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      showNotification(holiday);
    }, i * 5 * 60 * 60 * 1000); // 5 hours interval
  }
}

// Show the notification
function showNotification(holiday) {
  try {
    chrome.storage.local.get(['notificationSettings'], (result) => {
      const lang = result.notificationSettings?.language || 'en';
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: getNotificationTitle(lang),
        message: `${holiday.name[lang]}`,
        priority: 2
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('Notification error:', chrome.runtime.lastError);
        }
      });
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Get notification title based on language
function getNotificationTitle(lang) {
  const titles = {
    en: 'Tomorrow is a Holiday!',
    si: 'හෙට නිවාඩු දිනයකි!',
    ta: 'நாளை விடுமுறை!'
  };
  return titles[lang] || titles.en;
}

// Listen for language changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.notificationSettings) {
    notificationSettings = changes.notificationSettings.newValue;
  }
}); 