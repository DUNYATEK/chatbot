import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import BotsListPage from './pages/BotsListPage.jsx';
import BotDashboardPage from './pages/BotDashboardPage.jsx';
import { fetchBots } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchBots()
      .then(setBots)
      .catch(console.error);
  }, [user]);

  function handleLogin(u) {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1b3b' }}>
      {/* Sol dar sabit şerit: ana ikon, bot avatarları ve + butonu */}
      <div
        style={{
          width: 72,
          background: '#071431',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          color: 'white',
        }}
      >
        {/* Ana mavi buton: Bot Listem ekranını açar */}
        <div
          onClick={() => setSelectedBot(null)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#1d4ed8',
            marginBottom: 16,
            cursor: 'pointer',
          }}
        />

        {/* Bot avatarları listesi */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {bots.map(bot => {
            const isActive = selectedBot && selectedBot.id === bot.id;
            const initial = (bot.name || '?').trim().charAt(0).toUpperCase();
            return (
              <div
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 20%, #f9a8d4, #1d4ed8)',
                  border: isActive ? '2px solid #4ade80' : '2px solid #0f172a',
                  boxShadow: isActive ? '0 0 0 2px #22c55e55' : '0 2px 6px rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <span>{initial}</span>
                {/* Alt kısımda küçük durum noktası */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isActive ? '#22c55e' : '#94a3b8',
                    border: '1px solid #0b1120',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Yeni bot oluşturma butonu */}
        <div
          onClick={() => {
            setSelectedBot(null);
            setShowCreateModal(true);
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#1d4ed8',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          +
        </div>
      </div>

      {/* Sağ tarafta değişen içerik: Bot Listem veya seçili bot dashboard'u */}
      <div style={{ flex: 1, background: '#f5f7fb' }}>
        {selectedBot ? (
          <BotDashboardPage
            user={user}
            bot={selectedBot}
            onBackToList={() => setSelectedBot(null)}
            onCreateNewBot={() => {
              setSelectedBot(null);
              setShowCreateModal(true);
            }}
            onBotUpdated={(updatedBot) => {
              setBots(prevBots => 
                prevBots.map(bot => 
                  bot.id === updatedBot.id ? updatedBot : bot
                )
              );
              setSelectedBot(updatedBot);
            }}
          />
        ) : (
          <BotsListPage
            user={user}
            bots={bots}
            onSelectBot={setSelectedBot}
            onBotCreated={bot => setBots(prev => [...prev, bot])}
            forceShowCreateModal={showCreateModal}
            onCloseCreateModal={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
