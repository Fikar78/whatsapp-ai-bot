const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

// ==========================================
// 1. PENGATURAN SERVER RAILWAY (WAJIB)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('✅ Server Bot WhatsApp Berjalan Normal di Railway!');
});

app.listen(PORT, () => {
    console.log(`🌐 Web server aktif di port ${PORT}`);
});

// ==========================================
// 2. KONFIGURASI BOT WHATSAPP
// ==========================================
const NOMOR_BOT = "+623856414676"; // Ganti dengan nomor bot kamu (Mulai dengan 62)

async function startBot() {
    // Menyimpan sesi login di folder auth_info
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Kita pakai Pairing Code, bukan QR
        logger: pino({ level: "silent" }), // Mematikan log bawaan Baileys yang spam
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    // EVENT: Menangani perubahan koneksi
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('\n✅ BOT BERHASIL LOGIN DAN AKTIF! Siap menerima pesan.\n');
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('❌ Koneksi terputus. Mencoba menghubungkan ulang...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('⚠️ Kamu telah logout. Hapus folder "auth_info" dan ulangi proses pairing.');
            }
        }
    });

    // EVENT: Menyimpan kredensial saat ada perubahan
    sock.ev.on('creds.update', saveCreds);

    // EVENT: Membaca dan membalas pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        let messageText = msg.message.conversation || 
                          msg.message.extendedTextMessage?.text || '';

        if (!messageText) return;

        console.log(`📩 Pesan masuk dari ${sender.split('@')[0]}: ${messageText}`);

        // Fitur Auto-Reply Sederhana
        const text = messageText.toLowerCase();
        
        if (text === '.ping') {
            await sock.sendMessage(sender, { text: '🏓 Pong! Bot aktif dan merespon dari Railway.' });
        } else if (text === 'halo' || text === 'hai') {
            await sock.sendMessage(sender, { text: 'Halo! Saya adalah bot WhatsApp. Ada yang bisa dibantu?' });
        }
    });

    // ==========================================
    // 3. SISTEM PAIRING CODE
    // ==========================================
    if (!sock.authState.creds.registered) {
        console.log('\n⏳ Menunggu sistem menyiapkan Pairing Code...');
        
        setTimeout(async () => {
            try {
                // Membersihkan nomor dari karakter aneh
                const phoneNumber = NOMOR_BOT.replace(/[^0-9]/g, '');
                
                // Meminta Pairing Code
                const code = await sock.requestPairingCode(phoneNumber);
                
                console.log('\n' + '='.repeat(40));
                console.log('🔔 NOTIFIKASI PAIRING CODE 🔔');
                console.log('='.repeat(40));
                console.log(`KODE KAMU: ${code}`);
                console.log('='.repeat(40));
                console.log('Cara memasukkan kode:');
                console.log('1. Buka aplikasi WhatsApp di HP Bot kamu.');
                console.log('2. Klik ikon titik tiga di kanan atas > Perangkat Tertaut.');
                console.log('3. Klik tombol "Tautkan Perangkat".');
                console.log('4. Pilih "Tautkan dengan nomor telepon saja" (di bagian bawah).');
                console.log(`5. Masukkan kode: ${code}`);
                console.log('='.repeat(40) + '\n');
                
            } catch (error) {
                console.error('❌ Gagal mendapatkan Pairing Code:', error.message);
            }
        }, 4000); // Jeda 4 detik agar Baileys siap
    }
}

// Menjalankan Bot
startBot().catch(console.error);
