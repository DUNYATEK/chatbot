// API tabanı: Lokal geliştirmede localhost, üretimde Vite env üzerinden gelir
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error('Giriş başarısız');
  }
  return res.json();
}

// Bot için kayıtlı PDF'leri getir
export async function fetchBotPdfs(botId) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/pdfs`);
  if (!res.ok) {
    throw new Error('PDF verileri getirilemedi');
  }
  return res.json();
}

// Bir PDF dosyasını bu bota yükle
export async function uploadBotPdf(botId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/bots/${botId}/pdfs/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error('PDF yükleme isteği başarısız');
  }
  return res.json();
}

export async function fetchBotPrompt(botId) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/prompt`);
  if (!res.ok) {
    throw new Error('Bot rol cümlesi getirilemedi');
  }
  return res.json();
}

export async function saveBotPrompt(botId, prompt) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error('Bot rol cümlesi kaydedilemedi');
  }
  return res.json();
}

export async function sendChatLlm(message, botId) {
  const res = await fetch(`${API_BASE}/api/chat-llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, botId }),
  });
  if (!res.ok) {
    throw new Error('LLM sohbet isteği başarısız');
  }
  return res.json();
}

export async function getLlmStatus() {
  const res = await fetch(`${API_BASE}/api/llm/status`);
  if (!res.ok) {
    throw new Error('LLM durumu alınamadı');
  }
  return res.json();
}

export async function updateLlmConfig({ apiKey, model }) {
  const res = await fetch(`${API_BASE}/api/llm/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, model }),
  });
  if (!res.ok) {
    throw new Error('LLM yapılandırması kaydedilemedi');
  }
  return res.json();
}

export async function fetchBotText(botId) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/text`);
  if (!res.ok) {
    throw new Error('Metin verisi getirilemedi');
  }
  return res.json();
}

export async function saveBotText(botId, text) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error('Metin verisi kaydedilemedi');
  }
  return res.json();
}

export async function fetchBotQA(botId) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/qa`);
  if (!res.ok) {
    throw new Error('Soru & Cevap verileri getirilemedi');
  }
  return res.json();
}

export async function saveBotQA(botId, items) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error('Soru & Cevap verileri kaydedilemedi');
  }
  return res.json();
}

export async function fetchBots() {
  const res = await fetch(`${API_BASE}/api/bots`);
  if (!res.ok) {
    throw new Error('Botlar getirilemedi');
  }
  return res.json();
}

export async function sendChat(message, botId) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, botId }),
  });
  if (!res.ok) {
    throw new Error('Sohbet isteği başarısız');
  }
  return res.json();
}

export async function createBot({ name, ownerId, isPublic }) {
  const res = await fetch(`${API_BASE}/api/bots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ownerId, isPublic }),
  });
  if (!res.ok) {
    throw new Error('Bot oluşturulamadı');
  }
  return res.json();
}

// Bot için kayıtlı linkleri getir
export async function fetchBotLinks(botId) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/links`);
  if (!res.ok) {
    throw new Error('Link verileri getirilemedi');
  }
  return res.json();
}

// Verilen URL'den sayfayı tarayıp botun link datasına eklet
export async function crawlBotLink(botId, url) {
  const res = await fetch(`${API_BASE}/api/bots/${botId}/links/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error('Link tarama isteği başarısız');
  }
  return res.json();
}
