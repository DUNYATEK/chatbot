const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const archiver = require('archiver');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// PDF uploadları için bellek tabanlı multer konfigürasyonu
const upload = multer({ storage: multer.memoryStorage() });

// Basit yapılandırma katmanı
const config = {
  port: Number(process.env.PORT) || 4000,
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  },
};

// Çalışma zamanında tutulacak OpenAI anahtarı
// Not: Ayrıca db/llm-config.json içine şifrelenmemiş olarak kaydederek
// sunucu yeniden başlatıldığında da aynı anahtarın yüklenmesini sağlayacağız.
// Bu dosyayı kesinlikle git'e ekleme ve paylaşma.
let runtimeOpenAiApiKey = config.llm.openaiApiKey || null;

const dbPath = path.join(__dirname, '..', '..', 'db');

function readJson(fileName) {
  const filePath = path.join(dbPath, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJson(fileName, data) {
  const filePath = path.join(dbPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Uygulama açılırken, eğer varsa llm-config.json dosyasından
// daha önce panelden girilmiş OpenAI anahtarını ve modeli yükle
try {
  const llmConfigPath = path.join(dbPath, 'llm-config.json');
  if (fs.existsSync(llmConfigPath)) {
    const raw = fs.readFileSync(llmConfigPath, 'utf-8');
    const stored = JSON.parse(raw || '{}');
    if (stored && typeof stored.apiKey === 'string' && stored.apiKey.trim()) {
      runtimeOpenAiApiKey = stored.apiKey.trim();
    }
    if (stored && typeof stored.model === 'string' && stored.model.trim()) {
      config.llm.openaiModel = stored.model.trim();
    }
  }
} catch (e) {
  console.error('llm-config.json okunurken hata:', e);
}

app.get('/api/ping', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJson('users.json');
  const user = users.find(
    u => u.email === email && u.password === password
  );
  if (!user) {
    return res.status(401).json({ ok: false, message: 'Geçersiz giriş' });
  }
  // Şimdilik token yok, sadece fake session
  res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get('/api/bots', (req, res) => {
  const bots = readJson('bots.json');
  res.json(bots);
});

app.post('/api/bots', (req, res) => {
  const { name, ownerId, isPublic } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ ok: false, message: 'name alanı zorunludur' });
  }
  const bots = readJson('bots.json');
  const nextId = bots.length ? Math.max(...bots.map(b => b.id || 0)) + 1 : 1;

  const newBot = {
    id: nextId,
    ownerId: ownerId || 1,
    name: name.trim(),
    status: 'active',
    messagesUsed: 0,
    messagesQuota: 50,
    createdAt: new Date().toISOString().slice(0, 10),
    isPublic: !!isPublic,
  };

  bots.push(newBot);
  writeJson('bots.json', bots);

  res.status(201).json({ ok: true, bot: newBot });
});

app.get('/api/bots/:botId/appearance', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }

  let all = [];
  try {
    all = readJson('appearances.json');
  } catch {
    all = [];
  }

  const entry = all.find((x) => x.botId === botId);

  // Frontend'deki varsayılan değerlerle uyumlu basit bir fallback
  const defaultAppearance = {
    title: 'Chatbot',
    showMessagePreview: false,
    welcomeMessageEnabled: true,
    welcomeMessage: 'Merhaba, size nasıl yardımcı olabilirim?',
    welcomePopupEnabled: false,
    suggestionsEnabled: true,
    suggestionsText: '',
    clearSuggestionsAfterFirstMessage: false,
    placeholderEnabled: true,
    placeholderText: '',
    leadCaptureEnabled: false,
    privacyLinkEnabled: true,
    privacyActionText: 'Read our',
    privacyLabelText: 'Privacy Policy',
    privacyUrl: 'https://',
    launcherShape: 'daire',
    launcherPosition: 'sag',
    launcherSize: 72,
    launcherIconType: 'emoji',
    launcherIconEmoji: '💬',
    launcherFillColor: '#2563eb',
    launcherBorderColor: '#0f172a',
    launcherIconColor: '#ffffff',
    launcherBarText: '',
    themeColor: '#2563eb',
    attentionSound: 'hicbiri',
    launcherAnimation: 'hicbiri',
    botAvatarUrl: '',
    headerHeight: 56,
    avatarSize: 32,
    avatarBackground: 'rgba(255,255,255,0.3)',
    openOnLoadDesktopOnly: false,
    hidePlatformBranding: false,
    customBrandingEnabled: false,
    chatWidth: 320,
    chatHeight: 480,
  };

  const defaultFormFields = [
    { id: 'name', label: 'Name', key: 'name', enabled: true, required: true },
    { id: 'email', label: 'Email', key: 'email', enabled: true, required: false },
    { id: 'phone', label: 'Phone Number', key: 'phone', enabled: true, required: true },
    { id: 'message', label: 'Message', key: 'message', enabled: true, required: false },
  ];

  res.json({
    ok: true,
    botId,
    appearance: entry && entry.appearance ? entry.appearance : defaultAppearance,
    formFields: entry && Array.isArray(entry.formFields) ? entry.formFields : defaultFormFields,
  });
});

app.put('/api/bots/:botId/appearance', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }

  const { appearance, formFields } = req.body || {};
  if (!appearance || typeof appearance !== 'object') {
    return res.status(400).json({ ok: false, message: 'appearance alanı zorunludur' });
  }
  if (!Array.isArray(formFields)) {
    return res.status(400).json({ ok: false, message: 'formFields bir dizi olmalıdır' });
  }

  let all = [];
  try {
    all = readJson('appearances.json');
  } catch {
    all = [];
  }

  const idx = all.findIndex((x) => x.botId === botId);
  const entry = { botId, appearance, formFields };
  if (idx === -1) {
    all.push(entry);
  } else {
    all[idx] = entry;
  }

  writeJson('appearances.json', all);

  res.json({ ok: true, botId, appearance, formFields });
});

app.get('/api/bots/:botId/qa', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const all = readJson('qa.json');
  const entry = all.find(x => x.botId === botId);
  res.json({ ok: true, items: entry ? entry.items || [] : [] });
});

app.post('/api/bots/:botId/qa', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const { items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ ok: false, message: 'items bir dizi olmalıdır' });
  }

  const all = readJson('qa.json');
  const idx = all.findIndex(x => x.botId === botId);
  const entry = { botId, items };
  if (idx === -1) {
    all.push(entry);
  } else {
    all[idx] = entry;
  }
  writeJson('qa.json', all);

  res.json({ ok: true, items });
});

app.get('/api/bots/:botId/text', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const all = readJson('texts.json');
  const entry = all.find(x => x.botId === botId);
  res.json({ ok: true, text: entry ? entry.text || '' : '' });
});

app.post('/api/bots/:botId/text', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const { text } = req.body || {};
  if (typeof text !== 'string') {
    return res.status(400).json({ ok: false, message: 'text alanı string olmalıdır' });
  }

  const all = readJson('texts.json');
  const idx = all.findIndex(x => x.botId === botId);
  const entry = { botId, text };
  if (idx === -1) {
    all.push(entry);
  } else {
    all[idx] = entry;
  }
  writeJson('texts.json', all);

  res.json({ ok: true, text });
});

// Bot bazlı PDF içerikleri
app.get('/api/bots/:botId/pdfs', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }

  try {
    let all = [];
    try {
      all = readJson('pdfs.json');
    } catch {
      all = [];
    }
    const items = all.filter((x) => x.botId === botId);
    res.json({ ok: true, items });
  } catch (err) {
    console.error('PDF listesi okunurken hata:', err);
    res.status(500).json({ ok: false, message: 'PDF listesi okunamadı' });
  }
});

// Tek PDF dosyası yükleyip metnini çıkar ve db/pdfs.json içinde sakla
app.post('/api/bots/:botId/pdfs/upload', upload.single('file'), async (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'PDF dosyası gereklidir' });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ ok: false, message: 'Sadece PDF dosyaları kabul edilir' });
  }

  try {
    const data = await pdfParse(req.file.buffer);
    let text = (data && data.text) || '';
    text = String(text || '').replace(/\s+/g, ' ').trim();

    const MAX_LEN = 50000;
    if (text.length > MAX_LEN) {
      text = text.slice(0, MAX_LEN);
    }

    let all = [];
    try {
      all = readJson('pdfs.json');
    } catch {
      all = [];
    }

    const filename = req.file.originalname || 'dosya.pdf';
    const id = Date.now();
    const item = {
      id,
      botId,
      filename,
      content: text,
      createdAt: new Date().toISOString(),
    };

    all.push(item);
    writeJson('pdfs.json', all);

    res.json({ ok: true, item });
  } catch (err) {
    console.error('PDF işlenirken hata:', err);
    res.status(500).json({ ok: false, message: 'PDF işlenirken hata oluştu' });
  }
});

// Bot bazlı link kaynakları (URL'den öğren) için basit depolama
app.get('/api/bots/:botId/links', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }

  try {
    let all = [];
    try {
      all = readJson('links.json');
    } catch {
      all = [];
    }
    const items = all.filter(x => x.botId === botId);
    res.json({ ok: true, items });
  } catch (err) {
    console.error('Link listesi okunurken hata:', err);
    res.status(500).json({ ok: false, message: 'Link listesi okunamadı' });
  }
});

// Basit bir "site tarayıcı": verilen URL'den başlayarak aynı host içindeki en fazla 20 sayfayı tarar
app.post('/api/bots/:botId/links/crawl', async (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ ok: false, message: 'url alanı zorunludur' });
  }

  try {
    // Başlangıç URL'sini normalize et
    let start;
    try {
      start = new URL(url);
    } catch {
      // Eğer protokol yoksa https varsayalım
      start = new URL('https://' + url.replace(/^\/+/, ''));
    }

    const maxPages = 20;
    const visited = new Set();
    const queue = [start.href];

    let all = [];
    try {
      all = readJson('links.json');
    } catch {
      all = [];
    }

    const crawledItems = [];

    while (queue.length > 0 && crawledItems.length < maxPages) {
      const currentUrl = queue.shift();
      if (!currentUrl || visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      let response;
      try {
        response = await fetch(currentUrl, { method: 'GET' });
      } catch (fetchErr) {
        console.error('URL getirilemedi:', currentUrl, fetchErr);
        continue;
      }
      if (!response.ok) {
        console.warn('URL yanıtı başarısız:', currentUrl, response.status);
        continue;
      }

      const html = await response.text();

      // Çok kaba bir HTML -> metin dönüştürme (ileride iyileştirilebilir)
      let text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();

      const MAX_LEN = 20000;
      if (text.length > MAX_LEN) {
        text = text.slice(0, MAX_LEN);
      }

      // Mevcut kaydı (botId+url) varsa üzerine yaz
      const existingIndex = all.findIndex(
        (x) => x.botId === botId && x.url === currentUrl,
      );
      const item = {
        botId,
        url: currentUrl,
        content: text,
        createdAt: new Date().toISOString(),
      };
      if (existingIndex === -1) {
        all.push(item);
      } else {
        all[existingIndex] = item;
      }
      crawledItems.push(item);

      // HTML içindeki linkleri çıkar ve kuyruğa ekle (aynı host içinde, max 20 sayfa)
      try {
        const hrefRegex = /href\s*=\s*"([^"]+)"/gi;
        const hrefRegexSingle = /href\s*=\s*'([^']+)'/gi;
        const links = [];
        let m;
        while ((m = hrefRegex.exec(html)) !== null) {
          links.push(m[1]);
        }
        while ((m = hrefRegexSingle.exec(html)) !== null) {
          links.push(m[1]);
        }

        for (const rawHref of links) {
          if (!rawHref) continue;
          const trimmed = rawHref.trim();
          if (
            !trimmed ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('mailto:') ||
            trimmed.startsWith('tel:')
          ) {
            continue;
          }
          let resolved;
          try {
            resolved = new URL(trimmed, currentUrl);
          } catch {
            continue;
          }

          if (resolved.hostname !== start.hostname) continue;

          const hrefFull = resolved.href.split('#')[0];
          if (!visited.has(hrefFull) && !queue.includes(hrefFull)) {
            if (queue.length + crawledItems.length < maxPages * 2) {
              queue.push(hrefFull);
            }
          }
        }
      } catch (linkParseErr) {
        console.error('HTML linkleri ayrıştırılırken hata:', linkParseErr);
      }
    }

    writeJson('links.json', all);

    res.json({ ok: true, items: crawledItems });
  } catch (err) {
    console.error('Link taranırken hata:', err);
    res.status(500).json({ ok: false, message: 'Link taranırken hata oluştu' });
  }
});

// Bot bazlı rol cümlesi (prompt) ayarları
app.get('/api/bots/:botId/prompt', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const all = readJson('prompts.json');
  const entry = all.find(x => x.botId === botId);
  res.json({ ok: true, prompt: entry ? entry.prompt || '' : '' });
});

app.post('/api/bots/:botId/prompt', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const { prompt } = req.body || {};
  if (typeof prompt !== 'string') {
    return res.status(400).json({ ok: false, message: 'prompt alanı string olmalıdır' });
  }

  const all = readJson('prompts.json');
  const idx = all.findIndex(x => x.botId === botId);
  const entry = { botId, prompt };
  if (idx === -1) {
    all.push(entry);
  } else {
    all[idx] = entry;
  }
  writeJson('prompts.json', all);

  res.json({ ok: true, prompt });
});

app.get('/api/bots/:botId/qa', (req, res) => {
  const botId = Number(req.params.botId);
  if (!botId) {
    return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
  }
  const all = readJson('qa.json');
  const entry = all.find(x => x.botId === botId);
  res.json({ ok: true, items: entry ? entry.items || [] : [] });
});

app.post('/api/chat', (req, res, next) => {
  const { message, botId } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ ok: false, message: 'message alanı zorunludur' });
  }

  let reply;

  // 1) Eğer botId varsa, önce ilgili botun Soru & Cevap verisine bak
  if (botId) {
    try {
      const allQa = readJson('qa.json');
      const entry = allQa.find(x => x.botId === Number(botId));
      const items = entry?.items || [];

      if (items.length > 0) {
        // Çok basit bir benzerlik hesaplama: ortak kelime sayısına göre skor
        const msgWords = Array.from(new Set(message.toLowerCase().split(/\s+/).filter(Boolean)));
        let best = null;
        let bestScore = 0;

        for (const qa of items) {
          if (!qa.question || !qa.answer) continue;
          const qLower = String(qa.question).toLowerCase();

          // Direkt içerme kontrolü (en güçlü sinyal)
          if (qLower.includes(message.toLowerCase()) || message.toLowerCase().includes(qLower)) {
            best = qa;
            bestScore = msgWords.length + 10; // yüksek skor ver
            break;
          }

          // Ortak kelime sayısı
          const qWords = qLower.split(/\s+/).filter(Boolean);
          let common = 0;
          for (const w of msgWords) {
            if (qWords.includes(w)) common += 1;
          }
          if (common > bestScore) {
            bestScore = common;
            best = qa;
          }
        }

        // Eşik: en az 1 ortak kelime veya direkt içerme
        if (best && bestScore >= 1) {
          reply = String(best.answer);
        }
      }
    } catch (err) {
      console.error('QA tabanlı cevap üretirken hata:', err);
    }
  }

  // 2) QA'dan cevap bulunamadıysa, bu kez eğitim metnini dene
  if (!reply && botId) {
    try {
      const allTexts = readJson('texts.json');
      const tEntry = allTexts.find(x => x.botId === Number(botId));
      const fullText = (tEntry && typeof tEntry.text === 'string') ? tEntry.text : '';
      const raw = fullText.trim();

      if (raw) {
        // Metni nokta, ünlem, soru işareti ve satır sonlarına göre parçalara ayır
        const segments = raw
          .split(/\n+|[.!?]+/)
          .map(s => s.trim())
          .filter(Boolean);

        const msgWords = Array.from(new Set(message.toLowerCase().split(/\s+/).filter(Boolean)));
        let bestSeg = null;
        let bestScore = 0;

        for (const seg of segments) {
          const segLower = seg.toLowerCase();

          // Direkt içerme varsa güçlü kabul et
          if (segLower.includes(message.toLowerCase()) || message.toLowerCase().includes(segLower)) {
            bestSeg = seg;
            bestScore = msgWords.length + 10;
            break;
          }

          const segWords = Array.from(new Set(segLower.split(/\s+/).filter(Boolean)));
          let common = 0;
          for (const w of msgWords) {
            if (segWords.includes(w)) common += 1;
          }
          if (common > bestScore) {
            bestScore = common;
            bestSeg = seg;
          }
        }

        // En az 1 ortak kelime varsa bu segmenti cevap olarak kullan
        if (bestSeg && bestScore >= 1) {
          reply = bestSeg;
        }
      }
    } catch (err) {
      console.error('Metin tabanlı cevap üretirken hata:', err);
    }
  }

  // 3) Hâlâ cevap yoksa, eski kural tabanlı yanıtı kullan
  if (!reply) {
    if (message.toLowerCase().includes('merhaba') || message.toLowerCase().includes('selam')) {
      reply = 'Merhaba! Size nasıl yardımcı olabilirim?';
    } else if (message.toLowerCase().includes('adın') || message.toLowerCase().includes('ismin')) {
      reply = 'Ben deneme sohbet botuyum. Yakında tamamen özelleştirileceğim.';
    } else if (message.toLowerCase().includes('teşekkür')) {
      reply = 'Rica ederim, her zaman buradayım.';
    } else {
      reply = 'Mesajınızı aldım: "' + message + '". Şu an deneme modundayım, yakında eğitim verilerinize göre daha akıllı cevaplar vereceğim.';
    }
  }
  res.json({ ok: true, botId: botId ?? null, reply });
});

app.post('/api/chat-llm', async (req, res, next) => {
  try {
    const { message, botId, systemPrompt } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ ok: false, message: 'message alanı zorunludur' });
    }

    const effectiveKey = runtimeOpenAiApiKey;
    if (!effectiveKey) {
      return res.status(503).json({
        ok: false,
        message: 'LLM sağlayıcısı yapılandırılmadı. Lütfen OPENAI_API_KEY ortam değişkenini ayarlayın.',
      });
    }

    const model = config.llm.openaiModel || 'gpt-4.1-mini';

    // 1) İlgili botun QA, Metin, Link ve PDF verilerinden basit bir bağlam (context) oluştur
    let qaContext = '';
    let textContext = '';
    let linkContext = '';
    let pdfContext = '';

    try {
      if (botId) {
        const lowerMsg = message.toLowerCase();
        const msgWords = Array.from(new Set(lowerMsg.split(/\s+/).filter(Boolean)));

        // QA'dan en alakalı birkaç kayıt
        const allQa = readJson('qa.json');
        const qaEntry = allQa.find(x => x.botId === Number(botId));
        const qaItems = qaEntry?.items || [];
        if (qaItems.length > 0) {
          const scoredQa = qaItems
            .map(item => {
              const qLower = String(item.question || '').toLowerCase();
              const qWords = Array.from(new Set(qLower.split(/\s+/).filter(Boolean)));
              let common = 0;
              for (const w of msgWords) {
                if (qWords.includes(w)) common += 1;
              }
              return { item, score: common };
            })
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

          if (scoredQa.length > 0) {
            qaContext = scoredQa
              .map(x => `Soru: ${x.item.question}\nCevap: ${x.item.answer}`)
              .join('\n\n');
          }
        }

        // Metin verisinden en alakalı birkaç paragraf
        const allTexts = readJson('texts.json');
        const tEntry = allTexts.find(x => x.botId === Number(botId));
        const fullText = (tEntry && typeof tEntry.text === 'string') ? tEntry.text : '';
        const raw = fullText.trim();
        if (raw) {
          const segments = raw
            .split(/\n+|[.!?]+/)
            .map(s => s.trim())
            .filter(Boolean);

          const scoredSegs = segments
            .map(seg => {
              const segLower = seg.toLowerCase();
              const segWords = Array.from(new Set(segLower.split(/\s+/).filter(Boolean)));
              let common = 0;
              for (const w of msgWords) {
                if (segWords.includes(w)) common += 1;
              }
              return { seg, score: common };
            })
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);

          if (scoredSegs.length > 0) {
            textContext = scoredSegs.map(x => x.seg).join('\n\n');
          }
        }

        // Link içeriklerinden (links.json) en alakalı birkaç bölüm
        try {
          let allLinks = [];
          try {
            allLinks = readJson('links.json');
          } catch {
            allLinks = [];
          }
          const linkItems = allLinks.filter((x) => x.botId === Number(botId));
          if (linkItems.length > 0) {
            const scoredLinks = linkItems
              .map((item) => {
                const cLower = String(item.content || '').toLowerCase();
                const cWords = Array.from(new Set(cLower.split(/\s+/).filter(Boolean)));
                let common = 0;
                for (const w of msgWords) {
                  if (cWords.includes(w)) common += 1;
                }
                return { item, score: common };
              })
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 2);

            if (scoredLinks.length > 0) {
              linkContext = scoredLinks
                .map((x) => `Kaynak: ${x.item.url}\nİçerik: ${x.item.content}`)
                .join('\n\n');
            }
          }
        } catch (linkErr) {
          console.error('Link bağlamı hazırlanırken hata:', linkErr);
        }

        // PDF içeriklerinden (pdfs.json) en alakalı birkaç bölüm
        try {
          let allPdfs = [];
          try {
            allPdfs = readJson('pdfs.json');
          } catch {
            allPdfs = [];
          }
          const pdfItems = allPdfs.filter((x) => x.botId === Number(botId));
          if (pdfItems.length > 0) {
            const scoredPdfs = pdfItems
              .map((item) => {
                const cLower = String(item.content || '').toLowerCase();
                const cWords = Array.from(new Set(cLower.split(/\s+/).filter(Boolean)));
                let common = 0;
                for (const w of msgWords) {
                  if (cWords.includes(w)) common += 1;
                }
                return { item, score: common };
              })
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 2);

            if (scoredPdfs.length > 0) {
              pdfContext = scoredPdfs
                .map((x) => `PDF: ${x.item.filename}\nİçerik: ${x.item.content}`)
                .join('\n\n');
            }
          }
        } catch (pdfErr) {
          console.error('PDF bağlamı hazırlanırken hata:', pdfErr);
        }
      }
    } catch (ctxErr) {
      console.error('LLM bağlamı hazırlanırken hata:', ctxErr);
    }

    const contextParts = [];
    if (qaContext) {
      contextParts.push('İlgili Soru & Cevaplar:\n' + qaContext);
    }
    if (textContext) {
      contextParts.push('İlgili Eğitim Metni Bölümleri:\n' + textContext);
    }
    if (linkContext) {
      contextParts.push('Web bağlantılarından çıkarılan içerikler:\n' + linkContext);
    }
    if (pdfContext) {
      contextParts.push('PDF belgelerinden alınan içerikler:\n' + pdfContext);
    }

    const combinedContext = contextParts.length ? contextParts.join('\n\n') : '';

    // 2) System prompt için öncelik sırası:
    // - İstekle gelen systemPrompt
    // - Bot için kaydedilmiş rol cümlesi (prompts.json)
    // - Varsayılan müşteri destek rolü
    let finalSystemPrompt = '';
    if (systemPrompt && typeof systemPrompt === 'string') {
      finalSystemPrompt = systemPrompt;
    } else if (botId) {
      try {
        const allPrompts = readJson('prompts.json');
        const pEntry = allPrompts.find(x => x.botId === Number(botId));
        if (pEntry && typeof pEntry.prompt === 'string' && pEntry.prompt.trim()) {
          finalSystemPrompt = pEntry.prompt.trim();
        }
      } catch (pErr) {
        console.error('Prompt okunurken hata:', pErr);
      }
    }

    if (!finalSystemPrompt) {
      finalSystemPrompt =
        'Sen bir web sitesi için müşteri destek sohbet botusun. Kısa, net ve kibar Türkçe cevaplar ver. ' +
        'Eğer elindeki bilgilere göre emin değilsen, tahmin yürütme ve dürüstçe bilmediğini söyle.';
    }

    if (combinedContext) {
      finalSystemPrompt +=
        '\n\nAşağıda bu bot için ilgili bilgi bölümleri verilmiştir. Bu bilgileri mümkün olduğunca kullanarak cevap ver:' +
        '\n\n' +
        combinedContext;
    }

    const messages = [];
    messages.push({ role: 'system', content: finalSystemPrompt });

    messages.push({ role: 'user', content: message });

    // Node 18+ sürümlerinde fetch global olarak mevcuttur.
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        message: 'LLM yanıtı alınamadı',
        status: response.status,
        body: errorBody,
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || '';

    if (!reply) {
      return res.status(502).json({ ok: false, message: 'LLM boş yanıt döndürdü' });
    }

    res.json({ ok: true, botId: botId ?? null, provider: config.llm.provider, model, reply });
  } catch (err) {
    next(err);
  }
});

// Bot adını güncelle
app.put('/api/bots/:botId', (req, res, next) => {
  try {
    const botId = Number(req.params.botId);
    const { name } = req.body || {};

    if (!botId || !name || typeof name !== 'string') {
      return res.status(400).json({ ok: false, message: 'Geçersiz botId veya name' });
    }

    const bots = readJson('bots.json');
    const idx = bots.findIndex((b) => b.id === botId);
    if (idx === -1) {
      return res.status(404).json({ ok: false, message: 'Bot bulunamadı' });
    }

    bots[idx].name = name;
    writeJson('bots.json', bots);

    res.json({ ok: true, bot: bots[idx] });
  } catch (err) {
    next(err);
  }
});

// Bot için PHP entegrasyon dosyası oluşturup indiren endpoint
app.get('/api/bots/:botId/php-integration', (req, res) => {
  try {
    const botId = Number(req.params.botId);
    if (!botId) {
      return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
    }

    const bots = readJson('bots.json');
    const bot = bots.find((b) => b.id === botId);
    if (!bot) {
      return res.status(404).json({ ok: false, message: 'Bot bulunamadı' });
    }

    const host = req.get('host') || 'localhost';
    const nowIso = new Date().toISOString();
    const phpCode = `<?php
/**
 * Dunyatek Chatbot Entegrasyon Kodu
 * Bot ID: ${botId}
 * Bot Adı: ${bot.name}
 * Oluşturulma Tarihi: ${nowIso}
 */

// Bot ID'si
define('DUNYATEK_BOT_ID', ${botId});

// API URL'si (gerekiyorsa güncelleyin)
define('DUNYATEK_API_URL', 'https://${host}');

if (!function_exists('dunyatek_chatbot_load_widget')) {
    function dunyatek_chatbot_load_widget() {
        ?>
        <div id="dunyatek-chatbot-container"></div>
        <script>
        window.dunyatekChatbotConfig = {
            botId: <?php echo DUNYATEK_BOT_ID; ?>,
            apiUrl: '<?php echo DUNYATEK_API_URL; ?>',
            buttonText: '',
            buttonColor: '#2563eb',
            position: 'right',
            autoInit: true
        };

        (function() {
            var script = document.createElement('script');
            script.src = '<?php echo DUNYATEK_API_URL; ?>/php-integration/widget.js';
            script.async = true;
            document.body.appendChild(script);
        })();
        </script>
        <?php
    }
}

if (!function_exists('dunyatek_chatbot_shortcode')) {
    function dunyatek_chatbot_shortcode() {
        ob_start();
        dunyatek_chatbot_load_widget();
        return ob_get_clean();
    }
    if (function_exists('add_shortcode')) {
        add_shortcode('dunyatek_chatbot', 'dunyatek_chatbot_shortcode');
    }
}

if (!defined('WPINC') && php_sapi_name() !== 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    dunyatek_chatbot_load_widget();
}
?>`;

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="dunyatek-chatbot-${botId}.php"`,
      'Content-Length': Buffer.byteLength(phpCode, 'utf8'),
    });

    return res.send(phpCode);
  } catch (error) {
    console.error('PHP entegrasyon dosyası oluşturulurken hata:', error);
    return res.status(500).json({ ok: false, message: 'PHP dosyası oluşturulamadı' });
  }
});

// WordPress eklentisini ZIP olarak oluşturan endpoint
app.get('/api/bots/:botId/plugin-zip', async (req, res) => {
  try {
    const botId = Number(req.params.botId);
    if (!botId) {
      return res.status(400).json({ ok: false, message: 'Geçersiz botId' });
    }

    const bots = readJson('bots.json');
    const bot = bots.find((b) => b.id === botId);
    if (!bot) {
      return res.status(404).json({ ok: false, message: 'Bot bulunamadı' });
    }

    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'plugins',
      'dunyatek-chatbot.php',
    );

    if (!fs.existsSync(templatePath)) {
      console.error('Plugin şablonu bulunamadı:', templatePath);
      return res.status(500).json({ ok: false, message: 'Plugin şablonu bulunamadı' });
    }

    const raw = fs.readFileSync(templatePath, 'utf-8');
    const pluginPhp = raw.replace(/__BOT_ID__/g, String(botId));

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dunyatek-chatbot-${botId}.zip"`,
    );

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (error) => {
      console.error('Plugin ZIP oluşturulurken hata:', error);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, message: 'ZIP oluşturulamadı' });
      } else {
        res.end();
      }
    });

    archive.pipe(res);
    archive.append(pluginPhp, {
      name: 'dunyatek-chatbot/dunyatek-chatbot.php',
      date: new Date(),
    });
    await archive.finalize();
  } catch (error) {
    console.error('Plugin ZIP oluşturulurken hata:', error);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, message: 'ZIP oluşturulamadı' });
    }
    res.end();
  }
});

// 404 için standart JSON cevap
app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Bulunamadı', path: req.originalUrl });
});

// Global hata yakalayıcı
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Beklenmeyen hata:', err);
  res.status(500).json({ ok: false, message: 'Sunucu hatası', error: err.message || String(err) });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});