import { useEffect, useState } from 'react';
import {
  sendChat,
  sendChatLlm,
  fetchBotQA,
  saveBotQA,
  fetchBotText,
  saveBotText,
  getLlmStatus,
  updateLlmConfig,
  fetchBotPrompt,
  saveBotPrompt,
  fetchBotLinks,
  crawlBotLink,
  fetchBotPdfs,
  uploadBotPdf,
  fetchBotAppearance,
  saveBotAppearance,
} from '../services/api';

const SECTIONS = [
  { id: 'overview', label: 'Genel Bakış' },
  { id: 'history', label: 'Sohbet Geçmişi' },
  { id: 'leads', label: 'Potansiyel müşteriler' },
  { id: 'livechat', label: 'Canlı Sohbet' },
  { id: 'docs', label: 'Bağlantılar / Belgeler' },
  { id: 'text', label: 'Metin' },
  { id: 'qa', label: 'Soru & Cevap' },
  { id: 'ai', label: 'AI Ayarı' },
  { id: 'test', label: 'Botunuzu Test Edin' },
  { id: 'appearance', label: 'Dış görünüş' },
  { id: 'deploy', label: 'Dağıtmak' },
  { id: 'integrations', label: 'Entegrasyonlar' },
  { id: 'settings', label: 'Ayarlar' },
];

const tabStyle = {
  borderRadius: 9999,
  border: 'none',
  padding: '6px 12px',
  background: '#e2e8f0',
  cursor: 'pointer',
};

export default function BotDashboardPage({ user, bot, onBackToList, onCreateNewBot }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: 'Yapay Zekâ Asistanıyım, siten için buradayım.' },
  ]);
  const [input, setInput] = useState('');
  const [trainingText, setTrainingText] = useState('');
  const [qaItems, setQaItems] = useState([]);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkItems, setLinkItems] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [chatMode, setChatMode] = useState('classic'); // 'classic' | 'llm'
  const [llmStatus, setLlmStatus] = useState({
    configured: false,
    provider: 'openai',
    model: '',
  });
  const [llmModelInput, setLlmModelInput] = useState('');
  const [llmApiKeyInput, setLlmApiKeyInput] = useState('');
  const [rolePrompt, setRolePrompt] = useState('');
  const [appearance, setAppearance] = useState({
    title: bot?.name || 'Chatbot',
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
    launcherBarText: '',
    themeColor: '#2563eb',
    attentionSound: 'hicbiri',
    launcherAnimation: 'hicbiri',
    botAvatarUrl: '',
    openOnLoadDesktopOnly: false,
    hidePlatformBranding: false,
    customBrandingEnabled: false,
    // Önizleme boyutları
    chatWidth: 320,
    chatHeight: 480,
  });

  const [formFields, setFormFields] = useState([
    { id: 'name', label: 'Name', key: 'name', enabled: true, required: true },
    { id: 'email', label: 'Email', key: 'email', enabled: true, required: false },
    { id: 'phone', label: 'Phone Number', key: 'phone', enabled: true, required: true },
    { id: 'message', label: 'Message', key: 'message', enabled: true, required: false },
  ]);

  const [leadFormValues, setLeadFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [leadFormErrors, setLeadFormErrors] = useState({});
  const [leadFormCompleted, setLeadFormCompleted] = useState(false);

  // Öneriler alanından (appearance.suggestionsText) gelen, botun sırayla soracağı sorular
  const [scriptedQuestions, setScriptedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasAskedFirstQuestion, setHasAskedFirstQuestion] = useState(false);
  const [questionsFlowActive, setQuestionsFlowActive] = useState(false);

  // Bot değiştiğinde Text, QA ve Appearance alanlarını önden yükle
  useEffect(() => {
    setQaItems([]);
    setQaQuestion('');
    setQaAnswer('');
    setTrainingText('');
    if (!bot?.id) return;

    let cancelled = false;

    // Bot için metni yükle
    fetchBotText(bot.id)
      .then((data) => {
        if (!cancelled && data && typeof data.text === 'string') {
          setTrainingText(data.text);
        }
      })
      .catch((err) => {
        console.error('Metin yükleme hatası', err);
      });

    // Bot için Soru & Cevap listesini yükle
    fetchBotQA(bot.id)
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.items)) {
          setQaItems(data.items);
        }
      })
      .catch((err) => {
        console.error('QA yükleme hatası', err);
      });

    // Bot için görünüm (appearance) ve form alanlarını yükle
    fetchBotAppearance(bot.id)
      .then((data) => {
        if (!cancelled && data && data.ok) {
          if (data.appearance && typeof data.appearance === 'object') {
            setAppearance((prev) => ({
              ...prev,
              ...data.appearance,
              // Başlık boş geldiyse bot adını kullanmaya devam et
              title: data.appearance.title || bot.name || prev.title,
            }));
          }
          if (Array.isArray(data.formFields)) {
            setFormFields(data.formFields);
          }
        }
      })
      .catch((err) => {
        console.error('Appearance yükleme hatası', err);
      });

    return () => {
      cancelled = true;
    };
  }, [bot?.id]);

  // AI Ayarı sekmesi açıldığında LLM durumunu yükle
  useEffect(() => {
    if (activeSection !== 'ai') return;

    getLlmStatus()
      .then((data) => {
        if (data && data.ok) {
          setLlmStatus({
            configured: !!data.configured,
            provider: data.provider || 'openai',
            model: data.model || '',
          });
          setLlmModelInput(data.model || 'gpt-4.1-mini');
        }
      })
      .catch((err) => {
        console.error('LLM durumu yüklenemedi', err);
      });

    if (bot?.id) {
      fetchBotPrompt(bot.id)
        .then((data) => {
          if (data && data.ok && typeof data.prompt === 'string') {
            setRolePrompt(data.prompt);
          }
        })
        .catch((err) => {
          console.error('Rol cümlesi yüklenemedi', err);
        });
    }
  }, [activeSection, bot?.id]);

  // appearance.suggestionsText değiştiğinde satır satır soruları hazırla
  useEffect(() => {
    const raw = appearance?.suggestionsText || '';
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    setScriptedQuestions(lines);
    // Soruları güncelliyoruz ama devam eden bir sohbeti bozmayalım diye
    // currentQuestionIndex / hasAskedFirstQuestion değerlerini koruyoruz.
  }, [appearance?.suggestionsText]);

  // Daha önce: lead formdan sonra otomatik ilk soru soruyorduk.
  // Artık sorular, kullanıcının mesajında web hizmetleriyle ilgili niyet gördüğümüzde
  // handleSend içinde başlatılacak; bu effect sadece state hazırlığı için bırakıldı.
  useEffect(() => {
    // leadFormCompleted veya suggestionsEnabled değiştiğinde akışı sıfırlamak istiyorsak
    // burada ileride ek mantık kurabiliriz. Şimdilik herhangi bir otomatik soru yok.
  }, [appearance.suggestionsEnabled, leadFormCompleted]);

  // Docs (Bağlantılar / Belgeler) sekmesi açıkken bu botun linklerini ve PDF'lerini yükle
  useEffect(() => {
    if (activeSection !== 'docs') return;
    if (!bot?.id) return;

    let cancelled = false;

    fetchBotLinks(bot.id)
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.items)) {
          setLinkItems(data.items);
        }
      })
      .catch((err) => {
        console.error('Link verileri yüklenemedi', err);
      });

    fetchBotPdfs(bot.id)
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.items)) {
          setPdfFiles(data.items);
        }
      })
      .catch((err) => {
        console.error('PDF verileri yüklenemedi', err);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSection, bot?.id]);

  // QA sekmesi açıkken arka planda yenileme
  useEffect(() => {
    if (activeSection !== 'qa') return;
    if (!bot?.id) return;

    let isCancelled = false;
    fetchBotQA(bot.id)
      .then((data) => {
        if (!isCancelled && data && Array.isArray(data.items)) {
          setQaItems(data.items);
        }
      })
      .catch((err) => {
        console.error('QA yükleme hatası', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSection, bot?.id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    const userMsg = { id: Date.now(), from: 'user', text };

    // Kullanıcının mesajında "web hizmetleri" niyetini basit keyword ile kontrol et
    const intentMatches = /web|site|hizmet/i.test(text);

    // 1) Eğer akış aktif değilse ve kullanıcı web hizmetleri hakkında soruyorsa,
    // soruları başlat: önce kısa açıklama, sonra ilk soru
    if (
      appearance.suggestionsEnabled &&
      scriptedQuestions.length > 0 &&
      !questionsFlowActive &&
      intentMatches
    ) {
      const first = scriptedQuestions[0];
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: 'Size web hizmetleri konusunda daha iyi yardımcı olabilmem için birkaç kısa soru soracağım.',
        },
        first
          ? {
              id: Date.now() + 2,
              from: 'bot',
              text: first,
            }
          : null,
      ].filter(Boolean));
      setQuestionsFlowActive(true);
      setHasAskedFirstQuestion(!!first);
      setCurrentQuestionIndex(first ? 1 : 0);
      setInput('');
      return;
    }

    // 2) Akış zaten aktifse ve hâlâ sorulacak soru varsa sıradaki soruyu sor
    if (
      appearance.suggestionsEnabled &&
      questionsFlowActive &&
      scriptedQuestions.length > 0 &&
      currentQuestionIndex < scriptedQuestions.length
    ) {
      const nextQ = scriptedQuestions[currentQuestionIndex];
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: Date.now() + 1, from: 'bot', text: nextQ },
      ]);
      setCurrentQuestionIndex((idx) => idx + 1);
      setInput('');
      return;
    }

    // 3) Akış yoksa veya tüm sorular bittiyse normal chat akışına dön
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res =
        chatMode === 'llm'
          ? await sendChatLlm(text, bot?.id)
          : await sendChat(text, bot?.id);

      if (res && res.ok && res.reply) {
        const botMsg = { id: Date.now() + 1, from: 'bot', text: res.reply };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errMsg = {
          id: Date.now() + 2,
          from: 'bot',
          text: 'Şu anda yanıt üretirken bir sorun oluştu.',
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err) {
      console.error('Chat hatası', err);
      const errMsg = {
        id: Date.now() + 3,
        from: 'bot',
        text: 'Sunucuya bağlanırken bir hata oluştu.',
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f5f7fb',
      }}
    >
      {/* Sol: menü + içerik */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Sol menü */}
        <aside
          style={{
            width: 260,
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            paddingTop: 16,
          }}
        >
          <div
            style={{
              padding: '0 16px 12px',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Menü</span>
            <button
              onClick={onBackToList}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ← Bot Listesi
            </button>
          </div>

          <nav style={{ padding: '0 8px', fontSize: 14 }}>
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  padding: '8px 12px',
                  marginBottom: 4,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background:
                    activeSection === section.id ? '#e0edff' : 'transparent',
                  color:
                    activeSection === section.id
                      ? '#1d4ed8'
                      : '#0f172a',
                }}
              >
                {section.label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Orta içerik */}
        <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          <header
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>
                {bot?.name || 'Bot'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {activeSection === 'overview'
                  ? 'Genel Bakış'
                  : activeSection === 'docs'
                  ? 'Veri Ekle'
                  : SECTIONS.find((s) => s.id === activeSection)?.label}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {user?.email}
            </div>
          </header>

          {/* Overview */}
          {activeSection === 'overview' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    marginBottom: 8,
                  }}
                >
                  Günümüzden Kullanıcılar
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  1
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    marginBottom: 8,
                  }}
                >
                  Mesajlar
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  12
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    marginBottom: 8,
                  }}
                >
                  Potansiyel müşteriler
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  5
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    marginBottom: 8,
                  }}
                >
                  Eğitim durumu
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  %30
                </div>
              </div>
            </div>
          )}

          {/* AI Ayarı */}
          {activeSection === 'ai' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <section>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Genel Bakış
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                    }}
                  >
                    Buradan bu bot için kullanılacak yapay zeka
                    sağlayıcısını ve modeli seçebilir, OpenAI
                    anahtarınızı girebilirsiniz.
                  </p>
                </section>

                <section>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{ flex: 1, minWidth: 220 }}
                    >
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        OpenAI Modelleri
                      </label>
                      <input
                        value={llmModelInput}
                        onChange={(e) =>
                          setLlmModelInput(
                            e.target.value,
                          )
                        }
                        placeholder="Örneğin: gpt-4.1-mini"
                        style={{
                          width: '100%',
                          padding: 8,
                          borderRadius: 8,
                          border:
                            '1px solid #d0d7e2',
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <div
                      style={{ flex: 1, minWidth: 220 }}
                    >
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        Sağlayıcı
                      </label>
                      <select
                        value={llmStatus.provider}
                        onChange={() => {}}
                        style={{
                          width: '100%',
                          padding: 8,
                          borderRadius: 8,
                          border:
                            '1px solid #d0d7e2',
                          fontSize: 13,
                          backgroundColor:
                            '#f1f5f9',
                          color: '#0f172a',
                        }}
                      >
                        <option value="openai">
                          OpenAI
                        </option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    OpenAI API Anahtarı
                  </label>
                  <input
                    type="password"
                    value={llmApiKeyInput}
                    onChange={(e) =>
                      setLlmApiKeyInput(
                        e.target.value,
                      )
                    }
                    placeholder="sk- ile başlayan anahtarınızı buraya girin"
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      fontSize: 13,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      marginTop: 4,
                    }}
                  >
                    Anahtar sadece bu sunucunun
                    belleğinde tutulur, dosyaya
                    kaydedilmez. Güvenlik için
                    anahtarınızı kimseyle paylaşmayın.
                  </p>
                </section>

                <section>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Yapay Zeka Talimatı (Rol
                    Cümlesi)
                  </label>
                  <textarea
                    value={rolePrompt}
                    onChange={(e) =>
                      setRolePrompt(e.target.value)
                    }
                    placeholder="Örnek: Sen bir satış elemanısın, adın Dunyatek Asistan. Kullanıcılarla daima nazik ve çözüm odaklı konuş."
                    style={{
                      width: '100%',
                      minHeight: 100,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      padding: 8,
                      fontSize: 13,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      marginTop: 4,
                    }}
                  >
                    Bu cümle, LLM için ana rol ve
                    davranış tanımıdır. Her cevapta
                    bu talimat dikkate alınacaktır.
                  </p>
                </section>

                <section
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 12 }}>
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Durum:{' '}
                    </span>
                    <span
                      style={{
                        color: llmStatus.configured
                          ? '#16a34a'
                          : '#ef4444',
                      }}
                    >
                      {llmStatus.configured
                        ? 'Yapılandırıldı'
                        : 'Yapılandırılmadı'}
                    </span>
                    {llmStatus.configured &&
                      llmStatus.model && (
                        <span
                          style={{
                            marginLeft: 8,
                            color: '#64748b',
                          }}
                        >
                          ({llmStatus.model})
                        </span>
                      )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (
                            llmApiKeyInput.trim()
                          ) {
                            await updateLlmConfig({
                              apiKey:
                                llmApiKeyInput.trim(),
                              model:
                                llmModelInput.trim() ||
                                undefined,
                            });
                            setLlmApiKeyInput('');
                          } else if (
                            llmModelInput.trim()
                          ) {
                            // Sadece modeli güncellemek istersen
                            await updateLlmConfig({
                              apiKey:
                                'placeholder',
                              model:
                                llmModelInput.trim(),
                            });
                          }

                          if (
                            bot?.id &&
                            rolePrompt.trim()
                          ) {
                            await saveBotPrompt(
                              bot.id,
                              rolePrompt.trim(),
                            );
                          }

                          const data =
                            await getLlmStatus();
                          if (data && data.ok) {
                            setLlmStatus({
                              configured:
                                !!data.configured,
                              provider:
                                data.provider ||
                                'openai',
                              model:
                                data.model || '',
                            });
                          }
                        } catch (err) {
                          console.error(
                            'LLM yapılandırması kaydedilemedi',
                            err,
                          );
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 9999,
                        border: 'none',
                        background: '#2563eb',
                        color: 'white',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Değişiklikleri Kaydet
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Docs */}
          {activeSection === 'docs' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 16,
              }}
            >
              {/* Link'ten öğren paneli */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Veri Ekle
                </h2>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Link'ten öğren
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    marginBottom: 16,
                  }}
                >
                  Bir web sayfasının bağlantısını
                  girin, biz o sayfadan başlayarak
                  ilgili sayfaları gezip içeriği
                  sizin için listeleyelim.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 16,
                    fontSize: 12,
                  }}
                >
                  <button style={tabStyle}>
                    Tam Web Sitesi
                  </button>
                  <button style={tabStyle}>
                    Web Sayfası
                  </button>
                  <button style={tabStyle}>PDF</button>
                  <button style={tabStyle}>
                    Kelime Belgesi
                  </button>
                  <button style={tabStyle}>
                    Excel/CSV
                  </button>
                  <button style={tabStyle}>
                    YouTube
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Hedef bağlantıyı girin (örn. https://dunyatek.com)"
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 9999,
                      border:
                        '1px solid #d0d7e2',
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bot?.id || !linkUrl.trim()) return;
                      try {
                        await crawlBotLink(bot.id, linkUrl.trim());
                        setLinkUrl('');
                        const data = await fetchBotLinks(bot.id);
                        if (data && Array.isArray(data.items)) {
                          setLinkItems(data.items);
                        }
                      } catch (err) {
                        console.error('Link tarama hatası', err);
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 9999,
                      border: 'none',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Başlat
                  </button>
                </div>

                {/* Bu bota ait kaydedilmiş linklerin basit listesi */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  {linkItems.length === 0 && (
                    <div>
                      Bu bot için henüz kaydedilmiş bir bağlantı yok.
                    </div>
                  )}
                  {linkItems.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {linkItems.map((item) => (
                        <div
                          key={`${item.botId}-${item.url}-${item.createdAt}`}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          >
                            {item.url}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#94a3b8',
                            }}
                          >
                            {item.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Belgeyi Yükle paneli */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Belgeyi Yükle
                </h2>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    border:
                      '1px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    Bir PDF dosyası seçin veya buraya
                    sürükleyin
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Şimdilik sadece PDF dosyaları
                    kabul edilmektedir. Her dosyanın
                    20MB'den küçük olması önerilir.
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedPdfFile(file);
                    }}
                    style={{ marginTop: 12, fontSize: 12 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!bot?.id || !selectedPdfFile) return;
                    try {
                      await uploadBotPdf(bot.id, selectedPdfFile);
                      setSelectedPdfFile(null);
                      const data = await fetchBotPdfs(bot.id);
                      if (data && Array.isArray(data.items)) {
                        setPdfFiles(data.items);
                      }
                    } catch (err) {
                      console.error('PDF yükleme hatası', err);
                    }
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: 'none',
                    background: '#cbd5e1',
                    color: '#0f172a',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Kaydetmek
                </button>

                {/* Bu bota ait yüklenmiş PDF listesi */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  {pdfFiles.length === 0 && (
                    <div>
                      Bu bot için henüz yüklenmiş bir PDF yok.
                    </div>
                  )}
                  {pdfFiles.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {pdfFiles.map((item) => (
                        <div
                          key={item.id || `${item.botId}-${item.filename}-${item.createdAt}`}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          >
                            {item.filename}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#94a3b8',
                            }}
                          >
                            {item.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Text sekmesi – metin ile eğit */}
          {activeSection === 'text' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Metin ile eğit
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    marginBottom: 12,
                  }}
                >
                  Bu, sohbet robotunuzu ek verilerle
                  hızlıca eğitmenin kolay bir yoludur.
                  Aşağıya herhangi bir metin
                  ekleyebilirsiniz.
                </p>

                <div
                  style={{
                    minHeight: 260,
                    background: '#f8fafc',
                    borderRadius: 12,
                    border:
                      '1px solid #e2e8f0',
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <textarea
                    value={trainingText}
                    onChange={(e) =>
                      setTrainingText(e.target.value)
                    }
                    placeholder="Eğitim içeriğini buraya girin."
                    style={{
                      width: '100%',
                      height: 220,
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      background: 'transparent',
                      fontSize: 14,
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: '#94a3b8',
                    marginBottom: 8,
                  }}
                >
                  <span>
                    {trainingText.length} karakter
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bot?.id) return;
                      try {
                        await saveBotText(
                          bot.id,
                          trainingText,
                        );
                      } catch (err) {
                        console.error(
                          'Metin kaydetme hatası',
                          err,
                        );
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 9999,
                      border: 'none',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QA sekmesi – soru & cevap */}
          {activeSection === 'qa' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Soru &amp; Cevap
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    marginBottom: 12,
                  }}
                >
                  Sık sorulan soruları ve cevaplarını
                  ekleyerek botunuza özel bilgi
                  tabanı oluşturun.
                </p>

                {/* Soru & Cevap giriş alanları */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <input
                    value={qaQuestion}
                    onChange={(e) =>
                      setQaQuestion(e.target.value)
                    }
                    placeholder="Soru"
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      fontSize: 14,
                    }}
                  />
                  <textarea
                    value={qaAnswer}
                    onChange={(e) =>
                      setQaAnswer(e.target.value)
                    }
                    placeholder="Cevap"
                    style={{
                      width: '100%',
                      minHeight: 80,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      padding: 8,
                      fontSize: 13,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          !qaQuestion.trim() ||
                          !qaAnswer.trim()
                        )
                          return;
                        const item = {
                          id: Date.now(),
                          question:
                            qaQuestion.trim(),
                          answer: qaAnswer.trim(),
                        };
                        setQaItems((prev) => [
                          ...prev,
                          item,
                        ]);
                        setQaQuestion('');
                        setQaAnswer('');
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 9999,
                        border: 'none',
                        background: '#22c55e',
                        color: 'white',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Ekle
                    </button>
                  </div>
                </div>

                {/* Kaydet / Sil butonları */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bot?.id) return;
                      try {
                        await saveBotQA(
                          bot.id,
                          qaItems,
                        );
                      } catch (err) {
                        console.error(
                          'QA kaydetme hatası',
                          err,
                        );
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      border: 'none',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setQaItems([])}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      border:
                        '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Sil ({qaItems.length})
                  </button>
                </div>

                {/* Mevcut Soru & Cevap listesi */}
                <div
                  style={{
                    borderTop:
                      '1px solid #e2e8f0',
                    marginTop: 8,
                    paddingTop: 8,
                    fontSize: 13,
                  }}
                >
                  {qaItems.length === 0 && (
                    <div style={{ color: '#94a3b8' }}>
                      Henüz eklenmiş bir soru-cevap
                      yok.
                    </div>
                  )}
                  {qaItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border:
                          '1px solid #e2e8f0',
                        marginBottom: 6,
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                          }}
                        >
                          S: {item.question}
                        </div>
                        <div
                          style={{
                            color: '#64748b',
                          }}
                        >
                          C: {item.answer}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQaItems((prev) =>
                            prev.filter(
                              (x) =>
                                x.id !== item.id,
                            ),
                          )
                        }
                        style={{
                          padding: '4px 10px',
                          borderRadius: 9999,
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Açıklama */}
                <p
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                  }}
                >
                  Bu bölümden sohbet robotunuzun
                  görünümünü ve bazı davranışlarını
                  ayarlayabilirsiniz.
                </p>

                {/* Başlık ve mesajlar */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Başlık
                    </span>
                    <label
                      style={{ fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={!!appearance.title}
                        onChange={() => {
                          // sadece örnek, başlık her zaman var kabul
                        }}
                      />
                      <span
                        style={{ marginLeft: 4 }}
                      >
                        Sohbet penceresinde
                        gösterilecek
                      </span>
                    </label>
                  </div>
                  <input
                    value={appearance.title}
                    onChange={(e) =>
                      setAppearance((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      fontSize: 14,
                    }}
                  />
                </section>

                {/* Girişler / Form ayarları */}
                <section style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      Girişler
                    </span>

                    {/* Sohbetten önce iletişim formu göster */}
                    <label
                      style={{
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={appearance.leadCaptureEnabled}
                        onChange={(e) =>
                          setAppearance((prev) => ({
                            ...prev,
                            leadCaptureEnabled: e.target.checked,
                          }))
                        }
                      />
                      Sohbetten önce iletişim formu göster
                    </label>
                  </div>

                  {appearance.leadCaptureEnabled && (
                    <>
                      {formFields.map((field) => (
                        <div
                          key={field.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            marginBottom: 6,
                            borderRadius: 8,
                            background: '#f1f5f9',
                          }}
                        >
                          {/* Sürükleme ikonu (şimdilik sadece görsel) */}
                          <div
                            style={{
                              width: 20,
                              cursor: 'grab',
                              color: '#94a3b8',
                            }}
                          >
                            ≡
                          </div>

                          {/* Sol taraftaki checkbox: alan aktif mi? */}
                          <label style={{ marginRight: 8 }}>
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) =>
                                setFormFields((prev) =>
                                  prev.map((f) =>
                                    f.id === field.id
                                      ? { ...f, enabled: e.target.checked }
                                      : f,
                                  ),
                                )
                              }
                            />
                          </label>

                          {/* Orta: alan adı */}
                          <input
                            value={field.label}
                            onChange={(e) =>
                              setFormFields((prev) =>
                                prev.map((f) =>
                                  f.id === field.id
                                    ? { ...f, label: e.target.value }
                                    : f,
                                ),
                              )
                            }
                            style={{
                              flex: 1,
                              border: 'none',
                              background: 'transparent',
                              fontSize: 14,
                              outline: 'none',
                            }}
                          />

                          {/* Sağ: zorunlu toggle + (varsa) silme butonu */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginLeft: 8,
                              gap: 6,
                              fontSize: 12,
                            }}
                          >
                            {/* Basit bir switch görünümü */}
                            <div
                              onClick={() =>
                                setFormFields((prev) =>
                                  prev.map((f) =>
                                    f.id === field.id
                                      ? { ...f, required: !f.required }
                                      : f,
                                  ),
                                )
                              }
                              style={{
                                width: 40,
                                height: 20,
                                borderRadius: 9999,
                                background: field.required ? '#2563eb' : '#cbd5e1',
                                position: 'relative',
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 2,
                                  left: field.required ? 22 : 2,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                  transition: 'left 0.15s',
                                }}
                              />
                            </div>
                            <span>Gerekli</span>

                            {field.id.startsWith('custom_') && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormFields((prev) =>
                                    prev.filter((f) => f.id !== field.id),
                                  )
                                }
                                style={{
                                  marginLeft: 8,
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                              >
                                Sil
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Özel alan ekle butonu */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const id = `custom_${Date.now()}`;
                            setFormFields((prev) => [
                              ...prev,
                              {
                                id,
                                label: 'Custom Field',
                                key: id,
                                enabled: true,
                                required: false,
                              },
                            ]);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 9999,
                            border: 'none',
                            background: '#2563eb',
                            color: 'white',
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          + Özel Alan Ekle
                        </button>
                      </div>
                    </>
                  )}
                </section>

                {/* Konum ve Boyut */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Konum ve Boyut
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setAppearance((prev) => ({
                          ...prev,
                          launcherPosition: 'sol',
                        }))
                      }
                      style={{
                        padding: '6px 12px',
                        borderRadius: 9999,
                        border:
                          appearance.launcherPosition === 'sol'
                            ? '1px solid #2563eb'
                            : '1px solid #d0d7e2',
                        background:
                          appearance.launcherPosition === 'sol'
                            ? '#e0edff'
                            : '#ffffff',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Sol Alt
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAppearance((prev) => ({
                          ...prev,
                          launcherPosition: 'sag',
                        }))
                      }
                      style={{
                        padding: '6px 12px',
                        borderRadius: 9999,
                        border:
                          appearance.launcherPosition === 'sag'
                            ? '1px solid #2563eb'
                            : '1px solid #d0d7e2',
                        background:
                          appearance.launcherPosition === 'sag'
                            ? '#e0edff'
                            : '#ffffff',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Sağ Alt
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {/* Sohbet genişliği */}
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        Sohbet genişliği
                      </div>
                      <input
                        type="range"
                        min={260}
                        max={600}
                        value={appearance.chatWidth}
                        onChange={(e) =>
                          setAppearance((prev) => ({
                            ...prev,
                            chatWidth: Number(e.target.value),
                          }))
                        }
                        style={{ width: '100%' }}
                      />
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 4,
                        }}
                      >
                        {appearance.chatWidth}px
                      </div>
                    </div>

                    {/* Sohbet yüksekliği */}
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        Sohbet yüksekliği
                      </div>
                      <input
                        type="range"
                        min={320}
                        max={800}
                        value={appearance.chatHeight}
                        onChange={(e) =>
                          setAppearance((prev) => ({
                            ...prev,
                            chatHeight: Number(e.target.value),
                          }))
                        }
                        style={{ width: '100%' }}
                      />
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 4,
                        }}
                      >
                        {appearance.chatHeight}px
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          marginBottom: 4,
                        }}
                      >
                        Sohbet Başlat Simgesi Boyutu
                      </div>
                      <input
                        type="range"
                        min={58}
                        max={96}
                        value={appearance.launcherSize}
                        onChange={(e) =>
                          setAppearance((prev) => ({
                            ...prev,
                            launcherSize: Number(e.target.value),
                          }))
                        }
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </section>

                {/* Avatar */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Avatar
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      {appearance.botAvatarUrl ? (
                        <img
                          src={appearance.botAvatarUrl}
                          alt="Chatbot Avatar"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        '🤖'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result;
                            if (typeof result === 'string') {
                              setAppearance((prev) => ({
                                ...prev,
                                botAvatarUrl: result,
                              }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        style={{
                          width: '100%',
                          padding: 4,
                          borderRadius: 8,
                          border: '1px solid #d0d7e2',
                          fontSize: 12,
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          marginTop: 2,
                        }}
                      >
                        PNG, JPG gibi kare bir görsel yükleyin.
                      </div>
                    </div>
                  </div>
                </section>

                {/* Hoş Geldiniz Mesajı */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Hoş Geldiniz Mesajı
                    </span>
                    <label
                      style={{ fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          appearance.welcomeMessageEnabled
                        }
                        onChange={(e) =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              welcomeMessageEnabled:
                                e.target.checked,
                            }),
                          )
                        }
                      />
                      <span
                        style={{ marginLeft: 4 }}
                      >
                        Chatbot'un giriş mesajı
                      </span>
                    </label>
                  </div>
                  <input
                    value={appearance.welcomeMessage}
                    onChange={(e) =>
                      setAppearance((prev) => ({
                        ...prev,
                        welcomeMessage:
                          e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      fontSize: 14,
                    }}
                  />
                </section>

                {/* Öneriler */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Öneriler
                    </span>
                    <label
                      style={{ fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          appearance.suggestionsEnabled
                        }
                        onChange={(e) =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              suggestionsEnabled:
                                e.target.checked,
                            }),
                          )
                        }
                      />
                      <span
                        style={{ marginLeft: 4 }}
                      >
                        Kullanıcıya gösterilecek
                        sorular
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={
                      appearance.suggestionsText
                    }
                    onChange={(e) =>
                      setAppearance((prev) => ({
                        ...prev,
                        suggestionsText:
                          e.target.value,
                      }))
                    }
                    placeholder="Önerilerinizi girin (satır başına 1 öneri)"
                    style={{
                      width: '100%',
                      minHeight: 80,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      padding: 8,
                      fontSize: 13,
                    }}
                  />
                  <label
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        appearance.clearSuggestionsAfterFirstMessage
                      }
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          clearSuggestionsAfterFirstMessage:
                            e.target.checked,
                        }))
                      }
                    />
                    İlk kullanıcı mesajı
                    gönderildikten sonra Öneri
                    Listesini kaldırın
                  </label>
                </section>

                {/* Yer tutucu */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Yer tutucu
                    </span>
                    <label
                      style={{ fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          appearance.placeholderEnabled
                        }
                        onChange={(e) =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              placeholderEnabled:
                                e.target.checked,
                            }),
                          )
                        }
                      />
                      <span
                        style={{ marginLeft: 4 }}
                      >
                        Sorgu girişinde
                        gösterilecek
                      </span>
                    </label>
                  </div>
                  <input
                    value={
                      appearance.placeholderText
                    }
                    onChange={(e) =>
                      setAppearance((prev) => ({
                        ...prev,
                        placeholderText:
                          e.target.value,
                      }))
                    }
                    placeholder="Yer tutucu metni girin"
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      border:
                        '1px solid #d0d7e2',
                      fontSize: 14,
                    }}
                  />
                </section>

                {/* Gizlilik bağlantısı */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >
                      Gizlilik Politikası
                    </span>
                    <label
                      style={{ fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          appearance.privacyLinkEnabled
                        }
                        onChange={(e) =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              privacyLinkEnabled:
                                e.target.checked,
                            }),
                          )
                        }
                      />
                      <span
                        style={{ marginLeft: 4 }}
                      >
                        Sohbet arayüzüne
                        gizlilik bağlantısı ekleyin
                      </span>
                    </label>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <input
                      value={
                        appearance.privacyActionText
                      }
                      onChange={(e) =>
                        setAppearance(
                          (prev) => ({
                            ...prev,
                            privacyActionText:
                              e.target.value,
                          }),
                        )
                      }
                      placeholder="Eylem metni"
                      style={{
                        flex: 1,
                        padding: 8,
                        borderRadius: 8,
                        border:
                          '1px solid #d0d7e2',
                        fontSize: 13,
                      }}
                    />
                    <input
                      value={
                        appearance.privacyLabelText
                      }
                      onChange={(e) =>
                        setAppearance(
                          (prev) => ({
                            ...prev,
                            privacyLabelText:
                              e.target.value,
                          }),
                        )
                      }
                      placeholder="Bağlantı metni"
                      style={{
                        flex: 1,
                        padding: 8,
                        borderRadius: 8,
                        border:
                          '1px solid #d0d7e2',
                        fontSize: 13,
                      }}
                    />
                    <input
                      value={appearance.privacyUrl}
                      onChange={(e) =>
                        setAppearance(
                          (prev) => ({
                            ...prev,
                            privacyUrl:
                              e.target.value,
                          }),
                        )
                      }
                      placeholder="https://..."
                      style={{
                        flex: 1.4,
                        padding: 8,
                        borderRadius: 8,
                        border:
                          '1px solid #d0d7e2',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </section>

                {/* Renk teması */}
                <section>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Renk Teması
                  </div>
                  <div
                    style={{ display: 'flex', gap: 12 }}
                  >
                    {[
                      '#2563eb',
                      '#020617',
                      '#16a34a',
                      '#0891b2',
                      '#f97316',
                      '#ef4444',
                      '#a855f7',
                    ].map((color) => (
                      <div
                        key={color}
                        onClick={() =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              themeColor: color,
                            }),
                          )
                        }
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '9999px',
                          background: color,
                          cursor: 'pointer',
                          border:
                            appearance.themeColor ===
                            color
                              ? '3px solid #0f172a'
                              : '2px solid white',
                          boxShadow:
                            '0 0 0 1px #cbd5e1',
                        }}
                      />
                    ))}
                  </div>
                </section>

                {/* Dikkat çekiciler */}
                <section>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Dikkat Çekiciler
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginBottom: 8,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          marginBottom: 4,
                        }}
                      >
                        Widget göründüğünde
                        çalınacak ses
                      </div>
                      <select
                        value={
                          appearance.attentionSound
                        }
                        onChange={(e) =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              attentionSound:
                                e.target.value,
                            }),
                          )
                        }
                        style={{
                          width: '100%',
                          padding: 6,
                          borderRadius: 8,
                          border:
                            '1px solid #d0d7e2',
                        }}
                      >
                        <option value="hicbiri">
                          Hiçbiri
                        </option>
                        <option value="ping">
                          Ping
                        </option>
                        <option value="bell">
                          Zil
                        </option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          marginBottom: 4,
                        }}
                      >
                        Chatbot avatar simgesi
                        için animasyon
                      </div>
                      <select
                        value={
                          appearance.launcherAnimation
                        }
                        onChange={(e) =>
                          setAppearance(
                            (prev) => ({
                              ...prev,
                              launcherAnimation:
                                e.target.value,
                            }),
                          )
                        }
                        style={{
                          width: '100%',
                          padding: 6,
                          borderRadius: 8,
                          border:
                            '1px solid #d0d7e2',
                        }}
                      >
                        <option value="hicbiri">
                          Hiçbiri
                        </option>
                        <option value="pulse">
                          Nabız
                        </option>
                        <option value="bounce">
                          Zıplama
                        </option>
                      </select>
                    </div>
                  </div>
                  <label
                    style={{
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        appearance.openOnLoadDesktopOnly
                      }
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          openOnLoadDesktopOnly:
                            e.target.checked,
                        }))
                      }
                    />
                    Sohbet penceresini hemen aç
                    (Yalnızca Masaüstü)
                  </label>
                </section>

                {/* Beyaz etiket */}
                <section>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Beyaz Etiket
                  </div>
                  <label
                    style={{
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        appearance.hidePlatformBranding
                      }
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          hidePlatformBranding:
                            e.target.checked,
                        }))
                      }
                    />
                    Platform markasını gizle
                    (örnek)
                  </label>
                  <label
                    style={{
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        appearance.customBrandingEnabled
                      }
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          customBrandingEnabled:
                            e.target.checked,
                        }))
                      }
                    />
                    Özel markalama kullan (logo
                    ve renkler)
                  </label>
                </section>

                {/* Alt butonlar */}
                <section
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setAppearance({
                        title: bot?.name || 'Chatbot',
                        showMessagePreview: false,
                        welcomeMessageEnabled: true,
                        welcomeMessage:
                          'Merhaba, size nasıl yardımcı olabilirim?',
                        welcomePopupEnabled: false,
                        suggestionsEnabled: true,
                        suggestionsText: '',
                        clearSuggestionsAfterFirstMessage:
                          false,
                        placeholderEnabled: true,
                        placeholderText: '',
                        leadCaptureEnabled: false,
                        privacyLinkEnabled: true,
                        privacyActionText:
                          'Read our',
                        privacyLabelText:
                          'Privacy Policy',
                        privacyUrl: 'https://',
                        launcherShape: 'daire',
                        launcherSize: 72,
                        launcherBarText: '',
                        themeColor: '#2563eb',
                        attentionSound: 'hicbiri',
                        launcherAnimation:
                          'hicbiri',
                        openOnLoadDesktopOnly: false,
                        hidePlatformBranding: false,
                        customBrandingEnabled: false,
                      })
                    }
                    style={{
                      padding: '8px 16px',
                      borderRadius: 9999,
                      border:
                        '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Görünümü Sıfırla
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bot?.id) return;
                      try {
                        await saveBotAppearance(bot.id, {
                          appearance,
                          formFields,
                        });
                      } catch (err) {
                        console.error('Appearance kaydedilemedi', err);
                      }
                    }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 9999,
                      border: 'none',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Değişiklikleri Kaydet
                  </button>
                </section>
              </div>
            </div>
          )}
          {/* Entegrasyonlar */}
          {activeSection === 'integrations' && (
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Entegrasyonlar
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    marginBottom: 16,
                  }}
                >
                  Botunuzu farklı platformlara bağlamak için aşağıdaki entegrasyon
                  kartlarından birini seçin.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                  }}
                >
                  {/* WhatsApp */}
                  <div
                    style={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 160,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '9999px',
                          background: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        W
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          WhatsApp
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#64748b',
                            marginTop: 2,
                          }}
                        >
                          Otomatik yanıtlar için sohbet botunuzu bir WhatsApp
                          işletme numarasına bağlayın.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 9999,
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      GÜNCELLEME
                    </button>
                  </div>

                  {/* PHP tabanlı web sitesi */}
                  <div
                    style={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 160,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '9999px',
                          background: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        PHP
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          PHP tabanlı web sitesi
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#64748b',
                            marginTop: 2,
                          }}
                        >
                          Botunuzu herhangi bir PHP tabanlı web sitesine birkaç
                          satır kodla ekleyin.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 9999,
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      GÜNCELLEME
                    </button>
                  </div>

                  {/* WordPress */}
<div
  style={{
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 200,
  }}
>
  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '9999px',
        background: '#0ea5e9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: 18,
      }}
    >
      W
    </div>
    <div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        WordPress
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#64748b',
          marginTop: 2,
        }}
      >
        WordPress sitenize Dunyatek Chatbot&apos;u eklemek için önce
        eklentiyi indirin, sonra aşağıdaki shortcode&apos;u sayfanıza ekleyin.
      </div>
    </div>
  </div>

  {/* Adımlar */}
  <div
    style={{
      fontSize: 12,
      color: '#475569',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginBottom: 10,
    }}
  >
    <div>
      <strong>1.</strong> WordPress&apos;te Eklentiler &rarr; Yeni Ekle deyip
      bu eklentiyi yükleyin ve etkinleştirin.
    </div>
    <div>
      <strong>2.</strong> Aşağıdaki shortcode&apos;u WordPress sayfanıza
      ekleyin.
    </div>
  </div>

  {/* Shortcode alanı */}
  <div
    style={{
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginBottom: 8,
    }}
  >
    <input
      readOnly
      value={`[dunyatek_chatbot bot_id=\"${bot?.id || ''}\" position=\"right-bottom\"]`}
      style={{
        flex: 1,
        padding: 6,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        fontSize: 12,
        fontFamily: 'monospace',
      }}
    />
    <button
      type="button"
      onClick={() => {
        const text = `[dunyatek_chatbot bot_id=\"${bot?.id || ''}\" position=\"right-bottom\"]`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
      }}
      style={{
        padding: '6px 10px',
        borderRadius: 9999,
        border: 'none',
        background: '#2563eb',
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Kopyala
    </button>
  </div>

  {/* Plugin indir butonu */}
  <button
    type="button"
    onClick={() => {
      // Buraya gerçek plugin ZIP URL'ini koy
      window.open(
        'https://dunyatekchatbot.netlify.app/plugins/dunyatek-chatbot.zip',
        '_blank'
      );
    }}
    style={{
      marginTop: 4,
      width: '100%',
      padding: '8px 12px',
      borderRadius: 9999,
      border: 'none',
      background: '#0f172a',
      color: '#ffffff',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
    }}
  >
    WordPress Eklentisini İndir
  </button>
</div>

                  {/* Instagram */}
                  <div
                    style={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 160,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '9999px',
                          background:
                            'linear-gradient(135deg,#f97316,#ec4899,#6366f1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        I
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          Instagram
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#64748b',
                            marginTop: 2,
                          }}
                        >
                          Instagram işletme hesabınıza gelen mesajlara yanıt
                          vermek için chatbot'unuzu kullanın.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 9999,
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      GÜNCELLEME
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Henüz tasarlanmamış diğer sekmeler */}
          {activeSection !== 'overview' &&
            activeSection !== 'docs' &&
            activeSection !== 'text' &&
            activeSection !== 'qa' &&
            activeSection !== 'ai' &&
            activeSection !== 'appearance' &&
            activeSection !== 'test' && 
            activeSection !== 'integrations' &&
            (
              <div
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow:
                    '0 4px 12px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {
                    SECTIONS.find(
                      (s) =>
                        s.id === activeSection,
                    )?.label
                  }
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#64748b',
                  }}
                >
                  Bu bölüm için içerik henüz
                  tasarlanmadı. Menü başlıklarına
                  göre burada detaylı sayfalar
                  oluşturacağız.
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Sağ: test chat paneli */}
      <aside
        style={{
          width: Math.max(appearance.chatWidth + 40, 360),
          borderLeft: '1px solid #e2e8f0',
          background: 'white',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Botunuzu test edin
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#64748b',
            }}
          >
            Sağ tarafta botunuzla anlık olarak
            konuşabilirsiniz.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setChatMode('classic')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 9999,
              border: 'none',
              fontSize: 12,
              cursor: 'pointer',
              background:
                chatMode === 'classic'
                  ? appearance.themeColor
                  : '#e2e8f0',
              color:
                chatMode === 'classic'
                  ? 'white'
                  : '#0f172a',
            }}
          >
            Klasik
          </button>
          <button
            type="button"
            onClick={() => setChatMode('llm')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 9999,
              border: 'none',
              fontSize: 12,
              cursor: 'pointer',
              background:
                chatMode === 'llm'
                  ? appearance.themeColor
                  : '#e2e8f0',
              color:
                chatMode === 'llm'
                  ? 'white'
                  : '#0f172a',
            }}
          >
            LLM
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: appearance.chatWidth,
              height: appearance.chatHeight,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* HEADER */}
            <div
              style={{
                background: appearance.themeColor,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.3)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {appearance.botAvatarUrl ? (
                  <img
                    src={appearance.botAvatarUrl}
                    alt="Chatbot Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  '🤖'
                )}
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {appearance.title}
              </span>
            </div>

            {/* BODY: dış kenarlardan boşluk */}
            <div
              style={{
                flex: 1,
                padding: 12,
                boxSizing: 'border-box',
              }}
            >
              {/* İç beyaz kart: form veya chat */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 12,
                  background: '#ffffff',
                  padding: 12,
                  boxSizing: 'border-box',
                  boxShadow: '0 0 0 1px #e2e8f0 inset',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {appearance.leadCaptureEnabled && !leadFormCompleted ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const activeFields = formFields.filter((f) => f.enabled);
                      const missing = activeFields.filter(
                        (f) => f.required && !leadFormValues[f.key]?.trim(),
                      );
                      if (missing.length > 0) {
                        const nextErrors = {};
                        missing.forEach((f) => {
                          nextErrors[f.key] = 'Bu alan zorunludur.';
                        });
                        setLeadFormErrors(nextErrors);
                        return;
                      }
                      setLeadFormErrors({});
                      setLeadFormCompleted(true);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      padding: '4px 10px 10px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {formFields
                      .filter((f) => f.enabled)
                      .map((field) => (
                        <div
                          key={field.id}
                          style={{
                            fontSize: 13,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <label
                            style={{
                              display: 'block',
                              marginBottom: 4,
                            }}
                          >
                            {field.label}
                            {field.required && (
                              <span style={{ color: '#ef4444' }}> *</span>
                            )}
                          </label>
                          {field.key === 'message' ? (
                            <textarea
                              value={leadFormValues[field.key] || ''}
                              onChange={(e) =>
                                setLeadFormValues((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              rows={4}
                              style={{
                                width: '100%',
                                padding: 6,
                                borderRadius: 6,
                                border: '1px solid #d0d7e2',
                                fontSize: 13,
                                resize: 'vertical',
                              }}
                            />
                          ) : (
                            <input
                              value={leadFormValues[field.key] || ''}
                              onChange={(e) =>
                                setLeadFormValues((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              style={{
                                width: '100%',
                                padding: 6,
                                borderRadius: 6,
                                border: '1px solid #d0d7e2',
                                fontSize: 13,
                              }}
                            />
                          )}
                          {leadFormErrors[field.key] && (
                            <div
                              style={{
                                color: '#ef4444',
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {leadFormErrors[field.key]}
                            </div>
                          )}
                        </div>
                      ))}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: 8,
                      }}
                    >
                      <button
                        type="submit"
                        style={{
                          padding: '8px 18px',
                          borderRadius: 9999,
                          border: 'none',
                          background: appearance.themeColor,
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Sohbete Başla
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 4,
                      }}
                    >
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent:
                              msg.from === 'user'
                                ? 'flex-end'
                                : 'flex-start',
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '80%',
                              padding: '6px 10px',
                              borderRadius: 12,
                              fontSize: 13,
                              background:
                                msg.from === 'user'
                                  ? appearance.themeColor
                                  : '#e2e8f0',
                              color:
                                msg.from === 'user'
                                  ? 'white'
                                  : '#0f172a',
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={handleSend}
                      style={{
                        display: 'flex',
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      <input
                        value={input}
                        onChange={(e) =>
                          setInput(e.target.value)
                        }
                        placeholder="Mesajınızı yazın..."
                        style={{
                          flex: 1,
                          padding: 8,
                          borderRadius: 9999,
                          border: '1px solid #d0d7e2',
                          fontSize: 13,
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '8px 12px',
                          borderRadius: 9999,
                          border: 'none',
                          background: appearance.themeColor,
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Gönder
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
