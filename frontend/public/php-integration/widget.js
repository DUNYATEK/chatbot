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
        const launcherFillColor = appearance.launcherFillColor || themeColor;
        const launcherBorderColor = appearance.launcherBorderColor || 'rgba(15,23,42,0.25)';
        const launcherIconColor = appearance.launcherIconColor || '#ffffff';
        const launcherIconType = appearance.launcherIconType || 'emoji';
        const launcherIconEmoji = appearance.launcherIconEmoji || '💬';
        const chatIconUrl = appearance.chatIconUrl || '';
        const botTitle = appearance.title || 'Chatbot';
        const welcomeMessage = appearance.welcomeMessage || 'Merhaba, size nasıl yardımcı olabilirim?';
        const headerHeight = appearance.headerHeight || 56;
        const avatarSize = appearance.avatarSize || Math.max(Math.round(headerHeight * 0.6), 28);
        const avatarBackground = appearance.avatarBackground || 'rgba(255,255,255,0.3)';
        const buttonEmoji = config.buttonText || launcherIconEmoji;
        
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
        if (launcherIconType === 'image' && chatIconUrl) {
          const img = document.createElement('img');
          img.src = chatIconUrl;
          img.alt = 'Chat icon';
          img.style.width = '60%';
          img.style.height = '60%';
          img.style.objectFit = 'contain';
          toggleButton.appendChild(img);
        } else {
          toggleButton.innerText = buttonEmoji;
        }
        toggleButton.style.cssText = `
          position: fixed;
          ${launcherPosition}: 20px;
          bottom: 20px;
          width: ${launcherSize}px;
          height: ${launcherSize}px;
          background: ${launcherFillColor};
          color: ${launcherIconColor};
          border-radius: ${appearance.launcherShape === 'kare' ? '16px' : '9999px'};
          border: 1px solid ${launcherBorderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${launcherSize * 0.4}px;
          cursor: pointer;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        `;

        if (launcherIconType !== 'image' || !chatIconUrl) {
          toggleButton.style.fontSize = `${Math.max(20, launcherSize * 0.45)}px`;
        }

        const bubbleTail = document.createElement('span');
        bubbleTail.style.cssText = `
          position: absolute;
          ${launcherPosition === 'left' ? 'left: 10px;' : 'right: 10px;'}
          bottom: -6px;
          width: 14px;
          height: 14px;
          background: ${launcherFillColor};
          transform: rotate(45deg);
          border-bottom: 1px solid ${launcherBorderColor};
          border-${launcherPosition === 'left' ? 'right' : 'left'}: 1px solid ${launcherBorderColor};
          border-top: none;
          border-${launcherPosition === 'left' ? 'left' : 'right'}: none;
          z-index: -1;
        `;
        toggleButton.style.position = 'fixed';
        toggleButton.style.padding = '0';

        toggleButton.appendChild(bubbleTail);
        
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
              message: welcomeMessage,
              meta: {
                headerHeight,
                avatarSize,
                avatarBackground,
              },
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
