(function () {
  const globalConfig = window.DUNYATEK_CHATBOT_CONFIG || {};
  const botId = Number(globalConfig.botId) || 1;

  function resolveScriptOrigin() {
    try {
      const currentScript = document.currentScript || (function () {
        const scripts = document.querySelectorAll('script[src]');
        return scripts.length ? scripts[scripts.length - 1] : null;
      })();
      if (currentScript && currentScript.src) {
        const scriptUrl = new URL(currentScript.src, window.location.href);
        return scriptUrl.origin;
      }
    } catch (err) {
      console.warn('Script origin çözülemedi:', err);
    }
    return window.location.origin;
  }

  const scriptOrigin = resolveScriptOrigin();
  const apiBase = (globalConfig.apiUrl || 'https://dunyatekchatbot.onrender.com').replace(/\/$/, '');
  const widgetUrl = (function () {
    if (globalConfig.widgetUrl) {
      return globalConfig.widgetUrl;
    }
    try {
      return new URL('widget.html', scriptOrigin + '/').href;
    } catch (err) {
      console.warn('widget.html yolu çözülemedi:', err);
      return scriptOrigin + '/widget.html';
    }
  })();

  function fetchAppearance() {
    return fetch(`${apiBase}/api/bots/${botId}/appearance`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok && data.appearance) {
          return data.appearance;
        }
        throw new Error('Appearance bulunamadı');
      });
  }

  function createWidget(appearance) {
    if (document.getElementById('dunyatek-chatbot-launcher')) {
      return;
    }

    const launcherPosition = appearance.launcherPosition === 'sol' ? 'left' : 'right';
    const launcherSize = appearance.launcherSize || 72;
    const launcherFillColor = appearance.launcherFillColor || '#2563eb';
    const launcherBorderColor = appearance.launcherBorderColor || 'rgba(15,23,42,0.25)';
    const launcherIconColor = appearance.launcherIconColor || '#ffffff';
    const launcherIconType = appearance.launcherIconType || 'emoji';
    const launcherIconEmoji = appearance.launcherIconEmoji || '💬';
    const chatIconUrl = appearance.chatIconUrl || '';

    const chatWidth = appearance.chatWidth || 360;
    const chatHeight = appearance.chatHeight || 560;

    const iframe = document.createElement('iframe');
    iframe.id = 'dunyatek-chatbot-iframe';
    iframe.src = `${widgetUrl}?botId=${encodeURIComponent(botId)}`;
    iframe.style.cssText = `
      position: fixed;
      bottom: ${launcherSize + 36}px;
      ${launcherPosition}: 24px;
      width: ${chatWidth}px;
      height: ${chatHeight}px;
      border: none;
      border-radius: 16px;
      box-shadow: 0 10px 35px rgba(15,23,42,0.35);
      z-index: 99998;
      display: none;
      background: white;
    `;
    iframe.setAttribute('allow', 'clipboard-write; microphone;');
    document.body.appendChild(iframe);

    const toggleButton = document.createElement('div');
    toggleButton.id = 'dunyatek-chatbot-launcher';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 24px;
      ${launcherPosition}: 24px;
      width: ${launcherSize}px;
      height: ${launcherSize}px;
      background: ${launcherFillColor};
      color: ${launcherIconColor};
      border-radius: ${appearance.launcherShape === 'kare' ? '16px' : '9999px'};
      border: 1px solid ${launcherBorderColor};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(15,23,42,0.35);
      z-index: 100000;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      user-select: none;
    `;

    if (launcherIconType === 'image' && chatIconUrl) {
      const img = document.createElement('img');
      img.src = chatIconUrl;
      img.alt = 'Chat icon';
      img.style.width = '60%';
      img.style.height = '60%';
      img.style.objectFit = 'contain';
      toggleButton.appendChild(img);
    } else {
      toggleButton.innerText = globalConfig.buttonText || launcherIconEmoji;
      toggleButton.style.fontSize = `${Math.max(20, launcherSize * 0.45)}px`;
    }

    const bubbleTail = document.createElement('span');
    bubbleTail.style.cssText = `
      position: absolute;
      ${launcherPosition === 'left' ? 'left: 12px;' : 'right: 12px;'}
      bottom: -7px;
      width: 16px;
      height: 16px;
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

    toggleButton.addEventListener('mouseenter', () => {
      toggleButton.style.transform = 'scale(1.05)';
      toggleButton.style.boxShadow = '0 12px 30px rgba(15,23,42,0.4)';
    });
    toggleButton.addEventListener('mouseleave', () => {
      toggleButton.style.transform = 'scale(1)';
      toggleButton.style.boxShadow = '0 8px 25px rgba(15,23,42,0.35)';
    });

    document.body.appendChild(toggleButton);

    let isOpen = false;
    const metaPayload = {
      headerHeight: appearance.headerHeight || 56,
      avatarSize: appearance.avatarSize || Math.max(Math.round((appearance.headerHeight || 56) * 0.6), 28),
      avatarBackground: appearance.avatarBackground || 'rgba(255,255,255,0.3)',
    };

    function toggleChat() {
      isOpen = !isOpen;
      iframe.style.display = isOpen ? 'block' : 'none';

      if (isOpen) {
        toggleButton.style.transform = 'scale(0.92)';
        toggleButton.style.boxShadow = '0 4px 15px rgba(15,23,42,0.35)';
        const welcomeEvent = {
          type: 'CHAT_EVENT',
          event: 'welcome',
          message: appearance.welcomeMessage || 'Merhaba, size nasıl yardımcı olabilirim?',
          meta: metaPayload,
        };
        iframe.contentWindow?.postMessage(welcomeEvent, '*');
      } else {
        toggleButton.style.transform = 'scale(1)';
        toggleButton.style.boxShadow = '0 8px 25px rgba(15,23,42,0.35)';
      }
    }

    toggleButton.addEventListener('click', toggleChat);

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CHAT_EVENT' && event.data.action === 'close') {
        isOpen = false;
        iframe.style.display = 'none';
        toggleButton.style.transform = 'scale(1)';
        toggleButton.style.boxShadow = '0 8px 25px rgba(15,23,42,0.35)';
      }
    });

    if (appearance.openOnLoadDesktopOnly && window.innerWidth >= 768) {
      setTimeout(() => {
        if (!isOpen) toggleChat();
      }, 800);
    }
  }

  function init() {
    fetchAppearance()
      .then(createWidget)
      .catch((err) => {
        console.error('Dunyatek Chatbot yüklenirken hata:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
