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