// TaskQuest - App Logic

// ====================
// INITIALISATION
// ====================

const APP_VERSION = '1.0.0';
const STORAGE_KEY = 'taskquest_data';

// État global de l'app
let appState = {
  user: {
    name: 'Aventurier',
    age: 14,
    level: 1,
    xp: 0,
    maxXp: 100,
    coins: 0,
    mood: null,
    profileImage: null,
    joinDate: new Date().toISOString()
  },
  tasks: [],
  dailyRecap: null,
  notifications: {
    enabled: true,
    time: '20:00',
    soundEnabled: true
  },
  shop: {
    themes: [],
    profiles: [],
    purchased: []
  },
  settings: {
    recapTime: '20:00',
    soundVolume: 100,
    notificationsEnabled: true
  }
};

// ====================
// SAUVEGARDE/CHARGEMENT
// ====================

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    appState = JSON.parse(saved);
  }
}

// ====================
// INITIALISATION APP
// ====================

function initApp() {
  loadData();
  
  // Vérifier si c'est la première utilisation
  if (!localStorage.getItem('firstLaunch')) {
    showFirstLaunchSetup();
    localStorage.setItem('firstLaunch', 'true');
  } else {
    loadPage('home');
  }
  
  // Initialiser les événements
  setupEventListeners();
  
  // Vérifier si c'est l'heure du recap
  checkDailyRecap();
  
  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = e.currentTarget.dataset.page;
      loadPage(page);
    });
  });
  
  // Bouton + création tâche
  const addTaskBtn = document.getElementById('addTaskBtn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', openTaskModal);
  }
  
  // Modal création tâche
  const taskModal = document.getElementById('taskModal');
  const closeModalBtn = document.querySelector('.close-modal');
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeTaskModal);
  }
  
  if (taskModal) {
    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal) closeTaskModal();
    });
  }
  
  // Formulaire tâche
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', handleAddTask);
  }
}

// ====================
// PAGES
// ====================

function loadPage(pageName) {
  // Masquer toutes les pages
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  
  // Afficher la page demandée
  const page = document.getElementById(`${pageName}Page`);
  if (page) {
    page.style.display = 'block';
    
    // Appeler la fonction de rendu spécifique
    switch(pageName) {
      case 'home':
        renderHome();
        break;
      case 'stats':
        renderStats();
        break;
      case 'shop':
        renderShop();
        break;
      case 'settings':
        renderSettings();
        break;
      case 'recap':
        renderRecap();
        break;
    }
  }
  
  // Mettre à jour la nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === pageName) {
      btn.classList.add('active');
    }
  });
}

// ====================
// PAGE ACCUEIL
// ====================

function renderHome() {
  const container = document.getElementById('homeContent');
  if (!container) return;
  
  const tasksToday = appState.tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });
  
  const completedTasks = tasksToday.filter(t => t.completed).length;
  const totalTasks = tasksToday.length;
  
  container.innerHTML = `
    <div class="tasks-count">
      <p class="tasks-label">Tâches à faire</p>
      <p class="tasks-number">${totalTasks - completedTasks}/${totalTasks}</p>
    </div>
    
    <div class="tasks-list">
      ${tasksToday.length === 0 ? '<p class="no-tasks">Aucune tâche pour aujourd\'hui</p>' : ''}
      ${tasksToday.map((task, idx) => `
        <div class="task-card ${task.completed ? 'completed' : ''} difficulty-${task.difficulty}">
          <div class="task-header">
            <span class="task-emoji">${task.emoji}</span>
            <div class="task-info">
              <p class="task-name">${task.name}</p>
              <p class="task-time">${task.time || 'Flexible'}</p>
            </div>
          </div>
          <div class="task-actions">
            <span class="task-xp">+${task.xp}xp</span>
            <button class="task-checkbox" onclick="toggleTask(${idx})">
              ${task.completed ? '✓' : '○'}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  updateHeader();
}

function updateHeader() {
  const levelEl = document.querySelector('.header-level');
  const xpEl = document.querySelector('.header-xp');
  const coinsEl = document.querySelector('.header-coins');
  
  if (levelEl) levelEl.textContent = `LV ${appState.user.level}`;
  if (xpEl) xpEl.textContent = `${appState.user.xp}/${appState.user.maxXp}`;
  if (coinsEl) coinsEl.textContent = appState.user.coins;
}

// ====================
// GESTION TÂCHES
// ====================

function openTaskModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeTaskModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('taskForm').reset();
  }
}

function handleAddTask(e) {
  e.preventDefault();
  
  const name = document.getElementById('taskName').value;
  const emoji = document.getElementById('taskEmoji').value;
  const difficulty = document.getElementById('taskDifficulty').value;
  const time = document.getElementById('taskTime').value;
  const description = document.getElementById('taskDescription').value;
  
  // Calcul XP selon la difficulté
  const xpByDifficulty = {
    'facile': 10,
    'normal': 25,
    'difficile': 50,
    'cauchemar': 100
  };
  
  const task = {
    id: Date.now(),
    name,
    emoji,
    difficulty,
    time,
    description,
    xp: xpByDifficulty[difficulty] || 25,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  appState.tasks.push(task);
  saveData();
  closeTaskModal();
  renderHome();
}

function toggleTask(index) {
  appState.tasks[index].completed = !appState.tasks[index].completed;
  saveData();
  renderHome();
}

function deleteTask(index) {
  appState.tasks.splice(index, 1);
  saveData();
  renderHome();
}

// ====================
// PAGE STATS
// ====================

function renderStats() {
  const container = document.getElementById('statsContent');
  if (!container) return;
  
  const tasksToday = appState.tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });
  
  const completedTasks = tasksToday.filter(t => t.completed).length;
  const totalTasks = tasksToday.length;
  const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  
  const moodEmoji = {
    'super': '😍',
    'bien': '😊',
    'moyen': '😐',
    'bof': '😕',
    'mal': '😞',
    'catastrophique': '😱'
  };
  
  container.innerHTML = `
    <div class="stats-container">
      <div class="stat-card">
        <p class="stat-label">Tâches complétées</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <p class="stat-value">${completedTasks}/${totalTasks} (${percentage}%)</p>
      </div>
      
      <div class="stat-card">
        <p class="stat-label">Humeur d'aujourd'hui</p>
        <p class="mood-display">${appState.user.mood ? moodEmoji[appState.user.mood] : '❓'}</p>
        <p class="stat-value">${appState.user.mood ? appState.user.mood.toUpperCase() : 'Non définie'}</p>
      </div>
      
      <div class="stat-card">
        <p class="stat-label">Statistiques générales</p>
        <p class="stat-value">Niveau: ${appState.user.level}</p>
        <p class="stat-value">Total XP: ${appState.user.xp}</p>
        <p class="stat-value">Pièces: ${appState.user.coins}</p>
      </div>
    </div>
  `;
}

// ====================
// PAGE BOUTIQUE
// ====================

function renderShop() {
  const container = document.getElementById('shopContent');
  if (!container) return;
  
  // Articles de la boutique
  const shopItems = [
    {
      id: 1,
      name: 'Thème Dark',
      type: 'theme',
      price: 500,
      rarity: 'common',
      description: 'Thème sombre élégant'
    },
    {
      id: 2,
      name: 'Thème Cyberpunk',
      type: 'theme',
      price: 1500,
      rarity: 'rare',
      description: 'Thème futuriste neon'
    },
    {
      id: 3,
      name: 'Avatar Héros',
      type: 'profile',
      price: 800,
      rarity: 'rare',
      description: 'Image de profil héroïque'
    }
  ];
  
  container.innerHTML = `
    <div class="shop-container">
      <div class="shop-section">
        <h3>Cofre Normal</h3>
        <p class="shop-description">100 pièces par ouverture</p>
        <button class="buy-btn" onclick="openChest('normal')">Ouvrir (100)</button>
      </div>
      
      <div class="shop-section">
        <h3>Coffre Super</h3>
        <p class="shop-description">500 pièces par ouverture (Rares!)</p>
        <button class="buy-btn" onclick="openChest('super')">Ouvrir (500)</button>
      </div>
      
      <div class="shop-section">
        <h3>Articles</h3>
        ${shopItems.map(item => `
          <div class="shop-item rarity-${item.rarity}">
            <p class="item-name">${item.name}</p>
            <p class="item-desc">${item.description}</p>
            <button class="buy-btn" onclick="buyItem(${item.id})" ${appState.user.coins < item.price ? 'disabled' : ''}>
              ${item.price} 💰
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openChest(type) {
  const cost = type === 'normal' ? 100 : 500;
  
  if (appState.user.coins < cost) {
    alert('Pas assez de pièces!');
    return;
  }
  
  appState.user.coins -= cost;
  
  // Animation et son
  playSound('chest-open');
  
  // Génération aléatoire du butin
  const rewards = ['Theme', 'Avatar', 'Badge'];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  
  alert(`🎁 Vous avez obtenu: ${reward}!`);
  saveData();
  renderShop();
}

function buyItem(itemId) {
  alert('Article acheté! (Feature à développer)');
}

// ====================
// PAGE PARAMÈTRES
// ====================

function renderSettings() {
  const container = document.getElementById('settingsContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="settings-container">
      <div class="setting-group">
        <label for="recapTime">Heure du récap journalier</label>
        <input type="time" id="recapTime" value="${appState.settings.recapTime}" onchange="updateRecapTime(this.value)">
      </div>
      
      <div class="setting-group">
        <label for="soundVolume">Volume des sons</label>
        <input type="range" id="soundVolume" min="0" max="100" value="${appState.settings.soundVolume}" onchange="updateSoundVolume(this.value)">
      </div>
      
      <div class="setting-group">
        <label>
          <input type="checkbox" ${appState.settings.notificationsEnabled ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
          Notifications activées
        </label>
      </div>
      
      <div class="setting-group">
        <button class="danger-btn" onclick="resetAppData()">Réinitialiser les données</button>
      </div>
    </div>
  `;
}

function updateRecapTime(time) {
  appState.settings.recapTime = time;
  saveData();
}

function updateSoundVolume(volume) {
  appState.settings.soundVolume = volume;
  saveData();
}

function toggleNotifications(enabled) {
  appState.settings.notificationsEnabled = enabled;
  saveData();
}

function resetAppData() {
  if (confirm('Êtes-vous sûr? Cette action est irréversible!')) {
    localStorage.clear();
    location.reload();
  }
}

// ====================
// SYSTÈME NIVEAU/XP
// ====================

function addXP(amount) {
  appState.user.xp += amount;
  
  // Vérifier si level up
  while (appState.user.xp >= appState.user.maxXp) {
    levelUp();
  }
  
  saveData();
  updateHeader();
}

function levelUp() {
  appState.user.level += 1;
  appState.user.xp -= appState.user.maxXp;
  appState.user.maxXp = Math.round(appState.user.maxXp * 1.1); // +10% XP requis
  appState.user.coins += 50; // Bonus pièces
  
  playSound('levelup');
  alert(`🎉 LEVEL UP! Vous êtes maintenant niveau ${appState.user.level}!`);
}

// ====================
// RÉCAP FIN DE JOURNÉE
// ====================

function checkDailyRecap() {
  const recapTime = appState.settings.recapTime;
  const now = new Date();
  const [recapHour, recapMin] = recapTime.split(':').map(Number);
  
  if (now.getHours() === recapHour && now.getMinutes() >= recapMin) {
    const lastRecapDate = localStorage.getItem('lastRecapDate');
    const today = new Date().toDateString();
    
    if (lastRecapDate !== today) {
      showDailyRecap();
      localStorage.setItem('lastRecapDate', today);
    }
  }
}

function showDailyRecap() {
  // Calculer les tâches complétées d'aujourd'hui
  const tasksToday = appState.tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });
  
  const completedTasks = tasksToday.filter(t => t.completed);
  const totalXP = completedTasks.reduce((sum, t) => sum + t.xp, 0);
  
  appState.user.coins += Math.round(totalXP / 10); // Pièces basées sur XP
  addXP(totalXP);
  
  loadPage('recap');
}

function renderRecap() {
  const container = document.getElementById('recapContent');
  if (!container) return;
  
  const tasksToday = appState.tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });
  
  const completedTasks = tasksToday.filter(t => t.completed);
  const totalXP = completedTasks.reduce((sum, t) => sum + t.xp, 0);
  const coinsEarned = Math.round(totalXP / 10);
  
  container.innerHTML = `
    <div class="recap-container">
      <h2 class="recap-title">FIN DE JOURNÉE!</h2>
      <p class="recap-subtitle">Récap de vos missions</p>
      
      <div class="recap-tasks">
        ${tasksToday.map((task, idx) => `
          <div class="recap-task ${task.completed ? 'completed' : 'incomplete'}">
            <span>${task.emoji} ${task.name}</span>
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleRecapTask(${idx})">
          </div>
        `).join('')}
      </div>
      
      <div class="recap-rewards">
        <div class="reward-card">
          <p class="reward-label">XP Gagné</p>
          <p class="reward-value">+${totalXP}</p>
        </div>
        <div class="reward-card">
          <p class="reward-label">Pièces Gagnées</p>
          <p class="reward-value">+${coinsEarned}</p>
        </div>
      </div>
      
      <div class="mood-selector">
        <p class="mood-label">Comment était votre journée?</p>
        <div class="mood-buttons">
          <button class="mood-btn" style="background:#4169E1" onclick="setMood('super')">😍 Super</button>
          <button class="mood-btn" style="background:#228B22" onclick="setMood('bien')">😊 Bien</button>
          <button class="mood-btn" style="background:#FFD700" onclick="setMood('moyen')">😐 Moyen</button>
          <button class="mood-btn" style="background:#FFA500" onclick="setMood('bof')">😕 Bof</button>
          <button class="mood-btn" style="background:#FF6347" onclick="setMood('mal')">😞 Mal</button>
          <button class="mood-btn" style="background:#9932CC" onclick="setMood('catastrophique')">😱 Catastrophique</button>
        </div>
      </div>
      
      <button class="confirm-btn" onclick="finishRecap()">Confirmer et retour à l'accueil</button>
    </div>
  `;
  
  playSound('recap-music');
}

function toggleRecapTask(index) {
  appState.tasks[index].completed = !appState.tasks[index].completed;
  saveData();
}

function setMood(mood) {
  appState.user.mood = mood;
  saveData();
}

function finishRecap() {
  saveData();
  // Réinitialiser les tâches pour le prochain jour
  appState.tasks = appState.tasks.filter(t => !new Date(t.createdAt).toDateString() === new Date().toDateString());
  saveData();
  loadPage('home');
}

// ====================
// SONS
// ====================

function playSound(soundName) {
  if (!appState.settings.soundVolume || appState.settings.soundVolume === 0) return;
  
  // Créer des sons simples avec Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const volume = appState.settings.soundVolume / 100;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
  
  // Différents sons selon le type
  switch(soundName) {
    case 'levelup':
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
      
    case 'chest-open':
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
      break;
      
    case 'recap-music':
      // Petite mélodie simple
      const notes = [523.25, 587.33, 659.25, 783.99, 880];
      let time = audioContext.currentTime;
      notes.forEach(freq => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time);
        osc.stop(time + 0.3);
        time += 0.3;
      });
      break;
  }
}

// ====================
// PREMIER LANCEMENT
// ====================

function showFirstLaunchSetup() {
  const age = prompt('Quel est ton âge?', '14');
  if (age) {
    appState.user.age = parseInt(age);
    appState.user.name = prompt('Comment t\'appelles-tu?', 'Aventurier') || 'Aventurier';
    saveData();
  }
}

// ====================
// LANCER L'APP
// ====================

window.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', () => {
  // Vérifier le recap chaque minute
  setInterval(checkDailyRecap, 60000);
});

// Exposer les fonctions globales pour les événements HTML
window.toggleTask = toggleTask;
window.loadPage = loadPage;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.openChest = openChest;
window.buyItem = buyItem;
window.updateRecapTime = updateRecapTime;
window.updateSoundVolume = updateSoundVolume;
window.toggleNotifications = toggleNotifications;
window.resetAppData = resetAppData;
window.setMood = setMood;
window.finishRecap = finishRecap;
window.toggleRecapTask = toggleRecapTask;

/* ==================== TASKQUEST V2 COMPATIBILITY / HABITICA-LIKE LAYER ====================
   This layer replaces the broken DOM bindings from the previous app.js version while
   keeping the existing HTML structure and stored data compatible.
*/
(function () {
  const oldDefaultStreak = appState.user.streak || 0;
  appState.user.streak = oldDefaultStreak;
  appState.user.lastStreakDate = appState.user.lastStreakDate || null;
  appState.user.totalXpEarned = appState.user.totalXpEarned || 0;
  appState.user.totalTasksCompleted = appState.user.totalTasksCompleted || 0;
  appState.user.moodHistory = appState.user.moodHistory || {};
  appState.settings.soundEnabled = appState.settings.soundEnabled !== false;

  function dayKey(date) {
    const d = new Date(date || Date.now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function escapeText(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function todayTasks() {
    const key = dayKey();
    return appState.tasks.filter(function (task) {
      return dayKey(task.createdAt) === key;
    });
  }

  function updateHeaderV2() {
    const level = document.getElementById('level-value');
    const fill = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const coins = document.getElementById('coins-value');
    if (level) level.textContent = appState.user.level;
    if (fill) fill.style.width = Math.min(100, (appState.user.xp / appState.user.maxXp) * 100) + '%';
    if (xpText) xpText.textContent = appState.user.xp + ' / ' + appState.user.maxXp + ' XP';
    if (coins) coins.textContent = appState.user.coins;
  }

  function renderHomeV2() {
    const list = document.getElementById('task-list');
    const empty = document.getElementById('empty-state');
    if (!list) return;
    const tasks = todayTasks();
    const remaining = tasks.filter(function (task) { return !task.completed; }).length;
    const completed = tasks.length - remaining;
    const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;

    document.getElementById('tasks-remaining').textContent =
      tasks.length ? remaining + ' tâche(s) à faire • ' + completed + ' terminée(s)' : 'Prêt pour une nouvelle aventure ?';

    list.innerHTML = tasks.map(function (task) {
      const index = appState.tasks.indexOf(task);
      const xp = task.xp || ({ facile: 10, moyen: 25, normal: 25, difficile: 50, cauchemar: 100 }[task.difficulty] || 25);
      const time = task.time || 'Flexible';
      return '<article class="task-item ' + (task.completed ? 'done' : '') + '">' +
        '<button class="task-check ' + (task.completed ? 'checked' : '') + '" onclick="toggleTask(' + index + ')" aria-label="Terminer">' + (task.completed ? '✓' : '') + '</button>' +
        '<span class="task-emoji">' + escapeText(task.emoji || '📝') + '</span>' +
        '<div class="task-info"><div class="task-name">' + escapeText(task.name || 'Quête') + '</div>' +
        '<div class="task-meta">' + escapeText(time) + ' • +' + xp + ' XP</div></div>' +
        '<button class="task-delete" onclick="deleteTask(' + index + ')" aria-label="Supprimer">✕</button>' +
        '</article>';
    }).join('');

    if (empty) empty.style.display = tasks.length ? 'none' : 'block';
    updateHeaderV2();
  }

  function addXpv2(amount) {
    appState.user.xp += amount;
    appState.user.totalXpEarned += amount;
    while (appState.user.xp >= appState.user.maxXp) {
      appState.user.xp -= appState.user.maxXp;
      appState.user.level += 1;
      appState.user.maxXp = Math.round(appState.user.maxXp * 1.15);
      appState.user.coins += 50;
      playSound('levelup');
      setTimeout(function () { alert('🎉 Niveau ' + appState.user.level + ' ! +50 🪙'); }, 50);
    }
  }

  function updateStreakV2() {
    const today = dayKey();
    const last = appState.user.lastStreakDate;
    if (last === today) return;
    if (!last) {
      appState.user.streak = 1;
    } else {
      const a = new Date(last + 'T12:00:00');
      const b = new Date(today + 'T12:00:00');
      const days = Math.round((b - a) / 86400000);
      appState.user.streak = days === 1 ? (appState.user.streak || 0) + 1 : 1;
    }
    appState.user.lastStreakDate = today;
  }

  function toggleTaskV2(index) {
    const task = appState.tasks[index];
    if (!task) return;
    if (task.completed) {
      task.completed = false;
      saveData();
      renderHomeV2();
      return;
    }
    task.completed = true;
    const xp = task.xp || ({ facile: 10, moyen: 25, normal: 25, difficile: 50, cauchemar: 100 }[task.difficulty] || 25);
    const coins = ({ facile: 1, moyen: 3, normal: 3, difficile: 6, cauchemar: 10 }[task.difficulty] || 3);
    appState.user.coins += coins;
    appState.user.totalTasksCompleted += 1;
    addXpv2(xp);
    updateStreakV2();
    saveData();
    playSound('complete');
    renderHomeV2();
    renderStatsV2();
  }

  function deleteTaskV2(index) {
    if (!appState.tasks[index]) return;
    if (!confirm('Supprimer cette quête ?')) return;
    appState.tasks.splice(index, 1);
    saveData();
    renderHomeV2();
  }

  function openTaskModalV2() {
    const modal = document.getElementById('add-task-modal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('task-name-input').focus();
  }

  function closeTaskModalV2() {
    const modal = document.getElementById('add-task-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('task-name-input').value = '';
    document.getElementById('task-emoji-input').value = '';
    document.querySelectorAll('.diff-btn').forEach(function (btn) {
      btn.classList.toggle('selected', btn.dataset.diff === 'facile');
    });
  }

  function addTaskV2() {
    const nameInput = document.getElementById('task-name-input');
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    const emoji = document.getElementById('task-emoji-input').value.trim() || '📝';
    const difficulty = document.querySelector('.diff-btn.selected')?.dataset.diff || 'facile';
    const time = document.getElementById('task-time-select').value;
    const xp = ({ facile: 10, moyen: 25, difficile: 50 }[difficulty] || 25);

    appState.tasks.push({
      id: Date.now() + Math.random(),
      name: name,
      emoji: emoji,
      difficulty: difficulty,
      time: time,
      xp: xp,
      completed: false,
      createdAt: new Date().toISOString()
    });
    saveData();
    closeTaskModalV2();
    playSound('complete');
    renderHomeV2();
  }

  function renderStatsV2() {
    const tasks = todayTasks();
    const done = tasks.filter(function (task) { return task.completed; }).length;
    const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const ring = document.getElementById('score-ring');
    if (ring) ring.style.background = 'conic-gradient(var(--accent) ' + percent + '%, #000 ' + percent + '%)';
    const score = document.getElementById('score-value');
    if (score) score.textContent = percent + '%';

    const moodHistory = document.getElementById('mood-history');
    const moods = appState.user.moodHistory || {};
    if (moodHistory) {
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = dayKey(d);
        html += '<div style="text-align:center"><div class="mood-dot">' + (moods[key] || (key === dayKey() ? (appState.user.mood || '·') : '·')) + '</div><small>' +
          d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2) + '</small></div>';
      }
      moodHistory.innerHTML = html;
    }
    const level = document.getElementById('general-level-value');
    if (level) level.textContent = appState.user.level;
    updateHeaderV2();
  }

  function renderShopV2() {
    const content = document.getElementById('shop-content');
    if (!content) return;
    const tab = appState.shopTab || 'themes';
    document.querySelectorAll('.shop-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'gacha') {
      content.innerHTML =
        '<div class="stat-card" style="text-align:center"><div style="font-size:45px">🎁</div><h2>Coffre d’aventure</h2><p style="color:var(--text-dim)">100 🪙 • récompense aléatoire</p><button class="btn-primary" style="padding:10px 16px;border:2px solid #000;border-radius:8px" onclick="openChest()">Ouvrir le coffre</button></div>';
      return;
    }

    if (tab === 'icons') {
      content.innerHTML =
        '<div class="stat-card"><h2>🎒 Inventaire</h2><p style="color:var(--text-dim);font-size:12px">Objets débloqués : ' +
        (appState.shop.purchased || []).length + '</p></div>';
      return;
    }

    const themes = [
      { id: 'dark', name: '🌙 Nuit', price: 0 },
      { id: 'ocean', name: '🌊 Océan', price: 250 },
      { id: 'forest', name: '🌲 Forêt', price: 400 },
      { id: 'sunset', name: '🌅 Sunset', price: 600 }
    ];

    content.innerHTML = themes.map(function (theme) {
      const owned = theme.price === 0 || (appState.shop.purchased || []).indexOf(theme.id) !== -1;
      const active = (appState.shop.activeTheme || 'dark') === theme.id;
      return '<div class="shop-item"><div><strong>' + theme.name + '</strong><div style="font-size:10px;color:var(--text-dim)">' +
        (active ? 'Équipé' : owned ? 'Disponible dans ton inventaire' : 'Nouveau thème') + '</div></div>' +
        '<button ' + (active || (!owned && appState.user.coins < theme.price) ? 'disabled' : '') +
        ' onclick="' + (owned ? 'equipThemeV2(\'' + theme.id + '\')' : 'buyThemeV2(\'' + theme.id + '\')') + '">' +
        (active ? '✓' : owned ? 'Équiper' : theme.price + ' 🪙') + '</button></div>';
    }).join('');
  }

  function applyThemeV2(theme) {
    const root = document.documentElement;
    const themes = {
      dark: ['#16121f', '#241c35', '#6c5ce7', '#ff9f43'],
      ocean: ['#101b2d', '#172b45', '#2d9cdb', '#56ccf2'],
      forest: ['#101d18', '#193128', '#27ae60', '#f2c94c'],
      sunset: ['#24151b', '#3b2229', '#e76f51', '#f4a261']
    };
    const t = themes[theme] || themes.dark;
    root.style.setProperty('--bg', t[0]);
    root.style.setProperty('--bg-card', t[1]);
    root.style.setProperty('--accent', t[2]);
    root.style.setProperty('--accent2', t[3]);
  }

  function buyThemeV2(id) {
    const prices = { ocean: 250, forest: 400, sunset: 600 };
    const price = prices[id] || 0;
    if (appState.user.coins < price) return alert('🪙 Pas assez de pièces !');
    appState.user.coins -= price;
    appState.shop.purchased = appState.shop.purchased || [];
    appState.shop.purchased.push(id);
    appState.shop.activeTheme = id;
    applyThemeV2(id);
    saveData();
    renderShopV2();
    updateHeaderV2();
  }

  function equipThemeV2(id) {
    appState.shop.activeTheme = id;
    applyThemeV2(id);
    saveData();
    renderShopV2();
  }

  function openChestV2() {
    if (appState.user.coins < 100) return alert('🪙 Pas assez de pièces !');
    const rewards = ['✨ Badge Aventurier', '🎨 Couleur rare', '🧑‍🚀 Avatar spécial'];
    appState.user.coins -= 100;
    appState.shop.purchased = appState.shop.purchased || [];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    appState.shop.purchased.push(reward);
    saveData();
    playSound('chest-open');
    alert('🎁 Tu as obtenu : ' + reward + ' !');
    renderShopV2();
    updateHeaderV2();
  }

  function renderSettingsV2() {
    document.getElementById('recap-time').value = appState.settings.recapTime || '20:00';
    document.getElementById('notif-toggle').checked = !!appState.settings.notificationsEnabled;
    document.getElementById('notif-time').value = appState.notifications.time || '18:00';
    document.getElementById('age-input').value = appState.user.age || 14;
  }

  function setMoodV2(mood) {
    appState.user.mood = mood;
    appState.user.moodHistory = appState.user.moodHistory || {};
    appState.user.moodHistory[dayKey()] = mood;
    saveData();
    renderStatsV2();
  }

  function renderRecapV2() {
    const tasks = todayTasks();
    const list = document.getElementById('recap-task-list');
    const xp = tasks.filter(function (t) { return t.completed; }).reduce(function (sum, t) {
      return sum + (t.xp || 0);
    }, 0);
    const coins = tasks.filter(function (t) { return t.completed; }).reduce(function (sum, t) {
      return sum + ({ facile: 1, moyen: 3, normal: 3, difficile: 6, cauchemar: 10 }[t.difficulty] || 3);
    }, 0);
    document.getElementById('reward-xp').textContent = xp;
    document.getElementById('reward-coins').textContent = coins;
    if (list) list.innerHTML = tasks.length ? tasks.map(function (task) {
      return '<div class="shop-item"><span>' + escapeText(task.emoji) + ' ' + escapeText(task.name) + '</span><b>' + (task.completed ? '✓' : '—') + '</b></div>';
    }).join('') : '<p style="color:var(--text-dim)">Aucune quête aujourd’hui.</p>';
  }

  function showDailyRecapV2() {
    renderRecapV2();
    document.querySelectorAll('.page').forEach(function (page) { page.classList.remove('active'); });
    document.getElementById('page-recap')?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(function (btn) { btn.classList.remove('active'); });
  }

  function loadPageV2(pageName) {
    if (!['home', 'stats', 'shop', 'settings'].includes(pageName)) return;
    document.querySelectorAll('.page').forEach(function (page) { page.classList.remove('active'); });
    document.getElementById('page-' + pageName)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.page === pageName);
    });
    if (pageName === 'home') renderHomeV2();
    if (pageName === 'stats') renderStatsV2();
    if (pageName === 'shop') renderShopV2();
    if (pageName === 'settings') renderSettingsV2();
  }

  function finishRecapV2() {
    appState.lastRecapDate = dayKey();
    saveData();
    loadPageV2('home');
  }

  function setupV2() {
    appState.shop = appState.shop || { themes: [], profiles: [], purchased: [] };
    appState.shop.purchased = appState.shop.purchased || [];
    appState.shop.activeTheme = appState.shop.activeTheme || 'dark';
    applyThemeV2(appState.shop.activeTheme);

    document.querySelectorAll('.nav-btn[data-page]').forEach(function (btn) {
      btn.onclick = function () { loadPageV2(btn.dataset.page); };
    });
    document.getElementById('add-task-btn').onclick = openTaskModalV2;
    document.getElementById('cancel-task-btn').onclick = closeTaskModalV2;
    document.getElementById('confirm-task-btn').onclick = addTaskV2;
    document.getElementById('add-task-modal').onclick = function (e) { if (e.target === this) closeTaskModalV2(); };

    document.querySelectorAll('.diff-btn').forEach(function (btn) {
      btn.onclick = function () {
        document.querySelectorAll('.diff-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      };
    });
    document.querySelectorAll('.shop-tab').forEach(function (btn) {
      btn.onclick = function () {
        appState.shopTab = btn.dataset.tab;
        saveData();
        renderShopV2();
      };
    });

    document.getElementById('recap-time').onchange = function () { appState.settings.recapTime = this.value; saveData(); };
    document.getElementById('notif-toggle').onchange = function () { appState.settings.notificationsEnabled = this.checked; saveData(); };
    document.getElementById('notif-time').onchange = function () { appState.notifications.time = this.value; saveData(); };
    document.getElementById('age-input').onchange = function () { appState.user.age = Number(this.value) || 14; saveData(); };
    document.getElementById('reset-data-btn').onclick = resetAppData;

    document.getElementById('recap-validate-btn').onclick = function () { showRecapStepV2('rewards'); };
    document.getElementById('recap-mood-next-btn').onclick = function () { showRecapStepV2('mood'); };
    document.getElementById('recap-close-btn').onclick = function () { loadPageV2('home'); };
    document.querySelectorAll('.mood-btn').forEach(function (btn) {
      btn.onclick = function () { setMoodV2(btn.dataset.mood); showRecapStepV2('done'); };
    });

    renderHomeV2();
    renderStatsV2();
    renderShopV2();
    renderSettingsV2();
  }

  function showRecapStepV2(step) {
    document.querySelectorAll('.recap-step').forEach(function (el) { el.classList.remove('active'); });
    document.getElementById('recap-step-' + step)?.classList.add('active');
  }

  // Replace the broken original entry points.
  window.toggleTask = toggleTaskV2;
  window.deleteTask = deleteTaskV2;
  window.openTaskModal = openTaskModalV2;
  window.closeTaskModal = closeTaskModalV2;
  window.openChest = openChestV2;
  window.buyItem = buyThemeV2;
  window.equipThemeV2 = equipThemeV2;
  window.buyThemeV2 = buyThemeV2;
  window.loadPage = loadPageV2;
  window.finishRecap = finishRecapV2;
  window.setMood = setMoodV2;

  // The original DOMContentLoaded handler calls initApp, so replace it too.
  window.initApp = function () {
    loadData();
    if (appState.user.moodHistory == null) appState.user.moodHistory = {};
    setupV2();
    if (!localStorage.getItem('firstLaunch')) {
      showFirstLaunchSetup();
      localStorage.setItem('firstLaunch', 'true');
    }
    checkDailyRecap = function () {};
  };
})();
