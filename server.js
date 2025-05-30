const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { analyzeWithGemini } = require('./lib/gemini-service');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => { 
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

function cleanupMarkdown(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/\n\s*[-•]\s*/g, '\n- ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

app.post('/api/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
    Analisis detail gambar bukti transfer/pembayaran ini dan tentukan apakah ASLI atau PALSU.

    Tugas:
    1. Identifikasi asal sistem pembayaran:
      a) Bank: BCA, Mandiri, BNI, BRI, CIMB Niaga, Permata, dll.
      b) E-wallet: GoPay, OVO, DANA, LinkAja, ShopeePay, dll.
    2. Berdasarkan sistem teridentifikasi, tentukan keaslian dengan analisis mendalam.

    INDIKATOR UNIVERSAL BUKTI TRANSFER ASLI:
    - Konsistensi font: Satu jenis font utama dengan variasi ukuran yang konsisten
    - Layout terstruktur: Elemen tertata rapi sesuai standar aplikasi
    - Detail transaksi: Memiliki nomor referensi/ID transaksi yang valid
    - Detail waktu: Format tanggal dan waktu konsisten dengan standar aplikasi
    - Visual: Tidak ada artefak pengeditan, resolusi konsisten di seluruh gambar
    - Watermark: Posisi dan transparansi konsisten (jika ada)
    - Logo: Tajam dan sesuai dengan branding resmi
    - Warna: Skema warna sesuai dengan identitas visual platform

    INDIKATOR KUAT BUKTI PALSU:
    - Anomali visual: Area blur lokal, perbedaan resolusi, distorsi pixelasi
    - Anomali teks: Perbedaan jenis huruf, ukuran tidak proporsional, spasi tidak konsisten
    - Anomali layout: Elemen tidak sejajar, spacing tidak konsisten
    - Anomali data: Nilai transaksi/waktu/tanggal tidak logis atau tidak konsisten
    - Anomali format: Penulisan angka/mata uang tidak sesuai standar platform

    KARAKTERISTIK SPESIFIK BANK:
    - BCA: Logo biru, font Sans-serif, koma sebagai pemisah desimal, format tanggal DD/MM/YYYY
    - Mandiri: Logo biru-kuning, font khas Mandiri, titik sebagai pemisah ribuan
    - BNI: Dominan oranye-putih, font khusus BNI, pemisah ribuan dengan titik
    - BRI: Dominan biru, logo BRI di sudut, format waktu 24 jam

    KARAKTERISTIK SPESIFIK E-WALLET:
    - GoPay: Dominan biru-hitam, logo G, tanggal format DD MMM
    - OVO: Warna ungu dominan, font sans-serif modern
    - DANA: Dominan biru muda, ikon DANA di bagian atas
    - ShopeePay: Warna oranye-merah, logo S di pojok
    - LinkAja: Dominan merah, logo berbentuk segitiga dimodifikasi

    PETUNJUK PENTING:
    - Jangan nilai sebagai palsu hanya karena rapi/bersih - bisa karena screenshot berkualitas baik
    - Jangan nilai sebagai palsu hanya karena tanggal tidak sesuai - bisa untuk pengujian
    - Jangan nilai sebagai palsu hanya karena nominal tidak wajar - bisa untuk pengujian
    - Analisis struktur, konsistensi, dan kualitas visual keseluruhan

    BERIKAN JAWABAN DALAM FORMAT BERIKUT (tanpa markdown/formatting):
    Jenis: [Bank/E-wallet]
    Platform: [nama platform]
    Status: [ASLI/PALSU]
    Alasan: [berikan 3-5 kalimat penjelasan detail temuan spesifik]
    `;

    const analysisResult = await analyzeWithGemini(base64Image, prompt);
    const cleanedResult = cleanupMarkdown(analysisResult);

    let paymentType = "Tidak terdeteksi";
    const typeMatch = cleanedResult.match(/Jenis:\s*([^\n]+)/i);
    if (typeMatch && typeMatch[1]) {
      paymentType = typeMatch[1].trim();
    }

    let platform = "Tidak terdeteksi";
    const platformMatch = cleanedResult.match(/Platform:\s*([^\n]+)/i);
    if (platformMatch && platformMatch[1]) {
      platform = platformMatch[1].trim();
    }

    let status = "Tidak dapat ditentukan";
    let isAuthentic = false;
    let message = cleanedResult;

    const statusMatch = cleanedResult.match(/Status:\s*(ASLI|PALSU|Asli|Palsu)/i);
    if (statusMatch) {
      const extractedStatus = statusMatch[1].toUpperCase();
      status = extractedStatus === "ASLI" ? "Asli" : "Palsu";
      isAuthentic = status === "Asli";
    } 
    else {
      const lowerText = cleanedResult.toLowerCase();
      
      let authenticScore = 0;
      let fakeScore = 0;
      
      const authenticKeywords = [
        'asli', 'otentik', 'valid', 'sesuai standar', 'konsisten', 
        'tidak ada anomali', 'tata letak sesuai', 'format sesuai',
        'legitimate', 'genuine', 'selaras', 'tepat'
      ];
      
      const fakeKeywords = [
        'palsu', 'tidak asli', 'mencurigakan', 'janggal', 'tidak konsisten', 
        'editan', 'manipulasi', 'anomali', 'perbedaan font', 'tidak selaras',
        'artefak', 'distorsi', 'tidak proporsional', 'diragukan', 'meragukan',
        'tidak valid', 'inkonsistensi'
      ];
      
      authenticKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = lowerText.match(regex);
        if (matches) authenticScore += matches.length * 1.5;
      });
      
      fakeKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = lowerText.match(regex);
        if (matches) fakeScore += matches.length;
      });
      
      if (authenticScore > fakeScore) {
        status = "Asli";
        isAuthentic = true;
      } else if (fakeScore > authenticScore) {
        status = "Palsu";
        isAuthentic = false;
      }
      
      const reasonMatch = cleanedResult.match(/Alasan:\s*([^\n]+(?:\n[^\n]+)*)/i);
      if (reasonMatch) {
        const reason = reasonMatch[1].toLowerCase();
        
        if ((reason.includes('konsisten') && reason.includes('sesuai') && !reason.includes('tidak konsisten') && 
            !reason.includes('tidak sesuai')) || reason.includes('bukti transfer asli')) {
          status = "Asli";
          isAuthentic = true;
        }
        
        if ((reason.includes('edit') || reason.includes('manipulasi') || reason.includes('tidak konsisten') || 
            reason.includes('janggal') || reason.includes('anomali')) && !reason.includes('tidak ada anomali')) {
          status = "Palsu";
          isAuthentic = false;
        }
      }
    }

    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Error removing temp file:', err);
    }

    res.json({
      paymentType,
      platform,
      status,
      isAuthentic,
      message
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image', 
      details: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});