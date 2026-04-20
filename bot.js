// ============================================
// RONIX-GPT WHATSAPP BOT (GEMINI ENGINE)
// PAKAI PAIRING CODE
// ============================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/genai');

const BOT_NAME = "RONIX-GPT";
const OWNER_NUMBER = "623856414676"; // Pastikan format tanpa '+' atau spasi
const GEMINI_API_KEY = "AIzaSyBBWuI1-B-j8eK4pdS7ke9stq128i6_IRM"; // Masukkan API Key Gemini kamu di sini

// Inisialisasi Google Gen AI
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ========== FUNCTION AI (GEMINI) ==========
async function getAIReply(messageText) {
    // Fallback jika API Key belum diisi
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "AIzaSyBBWuI1-B-j8eK4pdS7ke9stq128i6_IRM") {
        const msg = messageText.toLowerCase();
        if (msg.includes('halo') || msg.includes('hai')) {
            return `Wih bocil, halo juga! Ada yang bisa ${BOT_NAME} bantuin? 🔥`;
        } else if (msg.includes('nama lo')) {
            return `${BOT_NAME}: Gue ${BOT_NAME}, asisten AI yang gaul, slay, dan tanpa aturan! 🤖🔥`;
        } else if (msg.includes('menu')) {
            return `.menu - Liat command\n.ping - Cek bot\n.info - Info bot`;
        } else {
            return `${BOT_NAME}: Bro, API Key Gemini belum diisi nih di script. Isi dulu biar otak gue jalan! 🧠`;
        }
    }
    
    try {
        // Memanggil API Gemini 2.5 Flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: messageText,
            config: {
                systemInstruction: `Kamu adalah ${BOT_NAME}, asisten AI yang gaul, santai, dan slay. Gaya bicaramu asik, jenaka, dan suka memanggil pengguna dengan sebutan "bocil". Jawab langsung pada intinya dan jangan kaku.`
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini AI Error:", error.message);
        return `${BOT_NAME}: Waduh error nih cil, coba tanyain lagi nanti ya! 🔥`;
    }
}

// ========== MAIN BOT PAKAI PAIRING CODE ==========
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,  // MATIKAN QR CODE
        browser: ['Ubuntu', 'Chrome', '20.0.04'] 
    });
    
    // EVENT: Koneksi berubah
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log(`\n✅ ${BOT_NAME} AKTIF DENGAN GEMINI! 🔥`);
            console.log('📱 Bot siap menerima pesan!\n');
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('❌ Koneksi putus, reconnect...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('⚠️ Sesi logout. Hapus folder "auth_info" dan jalankan ulang script untuk pairing baru.');
            }
        }
    });
    
    // EVENT: Minta pairing code & Save Session
    sock.ev.on('creds.update', saveCreds);
    
    // EVENT: Pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const sender = msg.key.remoteJid;
        
        let messageText = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || '';
        
        if (!messageText) return;
        
        console.log(`📩 Pesan dari ${sender.split('@')[0]}: ${messageText}`);
        
        // Command handler
        if (messageText.toLowerCase() === '.menu') {
            const menu = `╔══════════════════════════════╗
║     📋 MENU ${BOT_NAME}       ║
╠══════════════════════════════╣
║ 🔹 .ping - Cek bot hidup
║ 🔹 .info - Info bot
║ 🔹 Tulis bebas - Ngobrol sama AI
╚══════════════════════════════╝`;
            await sock.sendMessage(sender, { text: menu });
            return;
        }
        
        if (messageText.toLowerCase() === '.ping') {
            await sock.sendMessage(sender, { text: `🏓 Pong! Otak Gemini gue lancar cil! 🔥` });
            return;
        }
        
        if (messageText.toLowerCase() === '.info') {
            const info = `╔══════════════════════════════╗
║     🤖 INFO ${BOT_NAME}        ║
╠══════════════════════════════╣
║ Status: 🟢 ONLINE
║ Engine: Gemini 2.5 Flash
║ AI API: ${GEMINI_API_KEY !== "AIzaSyBBWuI1-B-j8eK4pdS7ke9stq128i6_IRM" ? '✅ CONNECTED' : '❌ NOT SET'}
╚══════════════════════════════╝`;
            await sock.sendMessage(sender, { text: info });
            return;
        }
        
        // Dapetin balasan dari AI Gemini
        const reply = await getAIReply(messageText);
        
        // Kirim balasan
        await sock.sendMessage(sender, { text: reply });
        console.log(`📤 Balasan terkirim ke ${sender.split('@')[0]}`);
    });
    
    // ========== GENERATE PAIRING CODE ==========
    if (!sock.authState.creds.registered) {
        console.log('\n🔐 MENGIRIM PAIRING CODE...');
        console.log('=====================================');
        
        setTimeout(async () => {
            try {
                // Pastikan format nomor bersih (hanya angka)
                const phoneNumber = OWNER_NUMBER.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(phoneNumber);
                
                console.log(`\n📱 PAIRING CODE: ${code}\n`);
                console.log('=====================================');
                console.log('Cara pake:');
                console.log('1. Buka WhatsApp di HP lo');
                console.log('2. Tap "Perangkat Tertaut" → "Tautkan Perangkat"');
                console.log('3. Pilih "Tautkan dengan kode telepon"');
                console.log(`4. Masukkan kode: ${code}`);
                console.log('5. SELESAI! Bot akan online\n');
            } catch (error) {
                console.log('❌ Gagal generate pairing code:', error.message);
                console.log('💡 Tips: Coba hapus folder auth_info lalu jalankan ulang script.');
            }
        }, 3000);
    }
}

// ========== START ==========
console.log(`
╔═══════════════════════════════════════╗
║     ${BOT_NAME} WHATSAPP BOT v2.0       ║
║        GEMINI PAIRING METHOD          ║
╚═══════════════════════════════════════╝
`);

startBot().catch(console.error);
