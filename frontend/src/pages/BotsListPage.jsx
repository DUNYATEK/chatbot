import { useEffect, useState } from 'react';
import { createBot } from '../services/api';

export default function BotsListPage({ user, bots, onSelectBot, onBotCreated, forceShowCreateModal, onCloseCreateModal }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (forceShowCreateModal) {
      setNewBotName('');
      setIsPublic(true);
      setShowCreateModal(true);
    }
  }, [forceShowCreateModal]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <header
        style={{
          height: 64,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18 }}>Bot Listem</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
      </header>
      <main style={{ padding: 24 }}>
        {/* Üst istatistik kutuları */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: '0 0 260px',
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Tüketilen mesajlar</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>0 / 50</div>
          </div>
          <div
            style={{
              flex: '0 0 260px',
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Tahsis edilen mesajlar</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>0 / 50</div>
          </div>
        </div>

        {/* Bot kartları alanı */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Mevcut bot kartlari */}
          {bots.map(bot => {
            const initial = (bot.name || '?').trim().charAt(0).toUpperCase();
            const isActive = bot.status === 'active';
            return (
              <div
                key={bot.id}
                onClick={() => onSelectBot && onSelectBot(bot)}
                style={{
                  width: 320,
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 20%, #f9a8d4, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{bot.name}</span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: isActive ? '#22c55e1a' : '#94a3b81a',
                          color: isActive ? '#16a34a' : '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        {isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{bot.createdAt || ''}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🔒</span>
                    <span>{bot.isPublic ? 'Genel' : 'Özel'}</span>
                  </div>
                  <div>
                    Mesaj: <strong>{bot.messagesUsed}</strong> / {bot.messagesQuota}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Yeni bot olustur karti */}
          <div
            onClick={() => {
              setNewBotName('');
              setIsPublic(true);
              setShowCreateModal(true);
            }}
            style={{
              width: 320,
              minHeight: 120,
              background: '#f1f5f9',
              borderRadius: 16,
              border: '1px dashed #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 4 }}>+</div>
            <div>Yeni Bot Oluştur</div>
          </div>
        </div>

        {/* Yeni Bot Olustur Modal */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div
              style={{
                width: 420,
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Yeni Bot Oluştur</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    onCloseCreateModal && onCloseCreateModal();
                  }}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}
                >
                  ×
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Lütfen chatbotunuza bir isim verin. Daha sonra değiştirebilirsiniz.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Bot adı</label>
                <input
                  value={newBotName}
                  onChange={e => setNewBotName(e.target.value)}
                  placeholder="Yeni bot adınızı yazın"
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #d0d7e2',
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                  />
                  Botu herkese açık yap (bunu daha sonra değiştirebilirsiniz)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  type="button"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newBotName.trim()) return;
                    try {
                      const result = await createBot({
                        name: newBotName.trim(),
                        ownerId: user?.id || 1,
                        isPublic,
                      });
                      if (result && result.ok && result.bot) {
                        onBotCreated && onBotCreated(result.bot);
                        setShowCreateModal(false);
                        onCloseCreateModal && onCloseCreateModal();
                      }
                    } catch (err) {
                      console.error('Bot oluşturma hatası', err);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563eb',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
