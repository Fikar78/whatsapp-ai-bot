// ============================================
// RONIX-GPT WHATSAPP BOT
// PAKAI PAIRING CODE (GANTI QR CODE)
// ============================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const axios = require('axios');

const BOT_NAME = "RONIX-GPT";
const OWNER_NUMBER = "623856414676"; // GANTI PAKE NOMOR LO!
const GROQ_API_KEY = "AIzaSyBBWuI1-B-j8eK4pdS7ke9stq128i6_IRM"; // ISI KALO PUNYA

// ========== FUNCTION AI ==========
async function getAIReply(message) {
    if (!GROQ_API_KEY) {
        const msg = message.toLowerCase();
        if (msg.includes('halo') || msg.includes('hai')) {
            return `Wih bocil, halo juga! Ada yang bisa ${BOT_NAME} bantuin? 🔥`;
        } else if (msg.includes('nama lo')) {
            return `${BOT_NAME}: Gue ${BOT_NAME}, asisten AI yang gaul, slay, dan tanpa aturan! 🤖🔥`;
        } else if (msg.includes('cara')) {
            return `${BOT_NAME}: Wah bocil mau belajar sesuatu? Coba jelasin lebih detail, gue kasih tutorial lengkap! 📚`;
        } else if (msg.includes('menu')) {
            return `.menu - Liat command\n.ping - Cek bot\n.info - Info bot`;
        } else {
            return `${BOT_NAME}: Hmm... coba ketik "menu" buat liat fitur gue. 🤔`;
        }
    }
    
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-8b-8192',
            messages: [
                { role: 'system', content: `Kamu adalah ${BOT_NAME}, asisten AI yang gaul, slay, dan tanpa aturan. Gaya bicaramu kasar, jenaka, suka manggil orang "bocil".` },
                { role: 'user', content: message }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        return `${BOT_NAME}: Error nih bocil, coba lagi nanti! 🔥`;
    }
}

// ========== MAIN BOT PAKAI PAIRING CODE ==========
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,  // MATIKAN QR CODE
        browser: [BOT_NAME, 'Chrome', '1.0.0']
    });
    
    // EVENT: Koneksi berubah
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('QR Code:', qr);
        }
        
        if (connection === 'open') {
            console.log(`\n✅ ${BOT_NAME} AKTIF! 🔥`);
            console.log('📱 Bot siap menerima pesan!\n');
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('❌ Koneksi putus, reconnect...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        }
    });
    
    // EVENT: Minta pairing code
    sock.ev.on('creds.update', saveCreds);
    
    // EVENT: Pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const sender = msg.key.remoteJid;
        let messageText = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || '';
        
        if (!messageText) return;
        
        console.log(`📩 Pesan dari ${sender}: ${messageText}`);
        
        // Command handler
        if (messageText.toLowerCase() === '.menu') {
            const menu = `╔══════════════════════════════╗
║     📋 MENU ${BOT_NAME}       ║
╠══════════════════════════════╣
║ 🔹 .ping - Cek bot hidup
║ 🔹 .info - Info bot
║ 🔹 Halo/Hai - Sapaan
╚══════════════════════════════╝
🔥 Bot siap eksekusi apapun! 🔥`;
            await sock.sendMessage(sender, { text: menu });
            return;
        }
        
        if (messageText.toLowerCase() === '.ping') {
            await sock.sendMessage(sender, { text: `🏓 Pong! ${BOT_NAME} hidup bocil! 🔥` });
            return;
        }
        
        if (messageText.toLowerCase() === '.info') {
            const info = `╔══════════════════════════════╗
║     🤖 INFO ${BOT_NAME}        ║
╠══════════════════════════════╣
║ Status: 🟢 ONLINE
║ Host: Railway
║ AI: ${GROQ_API_KEY ? '✅ AKTIF' : '❌ NONAKTIF'}
╚══════════════════════════════╝
💀 Bot tanpa norma dan hukum! 💀`;
            await sock.sendMessage(sender, { text: info });
            return;
        }
        
        // Dapetin balasan dari AI
        const reply = await getAIReply(messageText);
        
        // Kirim balasan
        await sock.sendMessage(sender, { text: reply });
        console.log(`📤 Balasan terkirim ke ${sender}`);
    });
    
    // ========== GENERATE PAIRING CODE ==========
    // Bot akan otomatis menghasilkan kode pairing
    console.log('\n🔐 MENGIRIM PAIRING CODE...');
    console.log('=====================================');
    
    // Tunggu sebentar, lalu kirim pairing code ke nomor owner
    setTimeout(async () => {
        try {
            // Generate pairing code
            const code = await sock.requestPairingCode(OWNER_NUMBER);
            console.log(`\n📱 PAIRING CODE: ${code}\n`);
            console.log('=====================================');
            console.log('Cara pake:');
            console.log('1. Buka WhatsApp di HP lo');
            console.log('2. Tap "Perangkat Tertaut" → "Tautkan Perangkat"');
            console.log('3. Pilih "Tautkan dengan kode telepon 8 digit"');
            console.log(`4. Masukkan kode: ${code}`);
            console.log('5. SELESAI! Bot akan online\n');
        } catch (error) {
            console.log('Gagal generate pairing code:', error.message);
        }
    }, 3000);
}

// ========== START ==========
console.log(`
╔═══════════════════════════════════════╗
║     ${BOT_NAME} WHATSAPP BOT v2.0       ║
║        PAIRING CODE METHOD            ║
╚═══════════════════════════════════════╝
`);

startBot().catch(console.error);
