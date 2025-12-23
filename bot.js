const { Client, NoAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const CONFIG = {
  groupNames: ['Magasin Laval', 'Team 82'],  // ← CHANGE ICI
  autoResponse: 'je peux',
  delayMs: 2000,
  startHour: 6,   // 6h matin
  endHour: 22     // 10h soir
};

const client = new Client({
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  },
  webVersionCache: {
    type: 'none'
  }
});

function isActiveTime() {
  const now = new Date();
  const montrealTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Montreal' }));
  const currentHour = montrealTime.getHours();
  return currentHour >= CONFIG.startHour && currentHour < CONFIG.endHour;
}

client.on('qr', (qr) => {
  console.log('📱 Scanne ce QR code:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot connecté!');
  console.log(`🎯 Groupes: ${CONFIG.groupNames.join(', ')}`);
  console.log(`⏰ Actif: ${CONFIG.startHour}h-${CONFIG.endHour}h`);
});

function analyzeMessage(text) {
  const keywords = ['shift', 'quart', 'remplacer', 'qui peut', 'qui serait', 
                    'qqun', 'quelqu\'un', 'dispo', 'disponible', 'libre', 
                    'besoin de', 'cherche', 'travail', 'travailler', 'venir'];
  return keywords.some(k => text.toLowerCase().includes(k));
}

client.on('message_create', async (message) => {
  try {
    if (!isActiveTime()) return;
    
    const chat = await message.getChat();
    if (!chat.isGroup || !CONFIG.groupNames.includes(chat.name) || message.fromMe) return;
    
    console.log(`📩 ${chat.name}: ${message.body}`);
    
    if (analyzeMessage(message.body)) {
      console.log('✅ Shift détecté!');
      setTimeout(async () => {
        await chat.sendMessage(CONFIG.autoResponse);
        console.log('✉️ Répondu!');
      }, CONFIG.delayMs);
    }
  } catch (e) {
    console.log('⚠️ Erreur:', e.message);
  }
});

console.log('🚀 Démarrage...');
client.initialize();