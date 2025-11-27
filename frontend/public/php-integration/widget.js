// PHP entegrasyonu için widget yükleyici
(function() {
  // Varsayılan yapılandırma
  const config = window.dunyatekChatbotConfig || {};
  const botId = config.botId || 1;
  
  // Sunucudan bot ayarlarını al
  fetch(`https://${window.location.host}/api/bots/${botId}/appearance`)
    .then(response => response.json())
    .then(data => {
      if (data.ok && data.appearance) {
        const appearance = data.appearance;
        
        // Tema rengini ve diğer ayarları uygula
        const themeColor = appearance.themeColor || '#2563eb';
        const launcherPosition = appearance.launcherPosition === 'sol' ? 'left' : 'right';
        const launcherSize = appearance.launcherSize || 60;
        const botTitle = appearance.title || 'Chatbot';
        const welcomeMessage = appearance.welcomeMessage || 'Merhaba, size nasıl yardımcı olabilirim?';
        const buttonText = config.buttonText || '💬';
        
        // Widget container oluştur
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'dunyatek-chatbot-widget';
        document.body.appendChild(widgetContainer);
        
        // Iframe oluştur
        const iframe = document.createElement('iframe');
        iframe.src = `https://${window.location.host}/widget.html?botId=${botId}`;
        iframe.style.cssText = `
          position: fixed;
          bottom: 20px;
          ${launcherPosition}: 20px;
          width: ${appearance.chatWidth || 350}px;
          height: ${appearance.chatHeight || 500}px;
          border: none;
          border-radius: 12px;
          box-shadow: 0 5px 40px rgba(0,0,0,0.15);
          z-index: 9999;
          display: none;
          background: white;
        `;
        widgetContainer.appendChild(iframe);
        
        // Açma/kapama butonu
        const toggleButton = document.createElement('div');
        toggleButton.innerHTML = buttonText;
        toggleButton.style.cssText = `
          position: fixed;
          ${launcherPosition}: 20px;
          bottom: 20px;
          width: ${launcherSize}px;
          height: ${launcherSize}px;
          background: ${themeColor};
          color: white;
          border-radius: ${appearance.launcherShape === 'kare' ? '8px' : '50%'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${launcherSize * 0.4}px;
          cursor: pointer;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        `;
        
        // Hover efekti
        toggleButton.addEventListener('mouseenter', () => {
          toggleButton.style.transform = 'scale(1.05)';
          toggleButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        });
        
        toggleButton.addEventListener('mouseleave', () => {
          toggleButton.style.transform = 'scale(1)';
          toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        });
        
        document.body.appendChild(toggleButton);
        
        // Toggle işlevi
        let isOpen = false;
        const toggleChat = () => {
          isOpen = !isOpen;
          iframe.style.display = isOpen ? 'block' : 'none';
          
          // Buton animasyonu
          if (isOpen) {
            toggleButton.style.transform = 'scale(0.9)';
            toggleButton.style.boxShadow = '0 1px 5px rgba(0,0,0,0.2)';
          } else {
            toggleButton.style.transform = 'scale(1)';
            toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
          }
          
          // Hoşgeldin mesajı
          if (isOpen && appearance.welcomeMessageEnabled) {
            const welcomeEvent = {
              type: 'CHAT_EVENT',
              event: 'welcome',
              message: welcomeMessage
            };
            iframe.contentWindow.postMessage(welcomeEvent, '*');
          }
        };
        
        toggleButton.addEventListener('click', toggleChat);
        
        // Mesaj dinleyici (iframe'den gelen mesajlar için)
        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CHAT_EVENT') {
            if (event.data.action === 'close') {
              isOpen = false;
              iframe.style.display = 'none';
              toggleButton.style.transform = 'scale(1)';
              toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            }
          }
        });
        
        // Masaüstünde otomatik açma
        if (appearance.openOnLoadDesktopOnly && window.innerWidth >= 768) {
          setTimeout(toggleChat, 1000);
        }
        
        console.log('Dunyatek Chatbot yüklendi. Bot ID:', botId);
      }
    })
    .catch(error => {
      console.error('Bot ayarları yüklenirken hata oluştu:', error);
    });
})();
