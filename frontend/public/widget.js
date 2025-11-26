(function () {
  // Global config
 
  function createLauncher() {
    var config = window.DUNYATEK_CHATBOT_CONFIG || {};
    if (document.getElementById('dunyatek-chatbot-launcher')) return;

    var btn = document.createElement('div');
    btn.id = 'dunyatek-chatbot-launcher';
    btn.style.position = 'fixed';

    var position = (config.position || 'right-bottom').toLowerCase();
    if (position.indexOf('left') !== -1) {
      btn.style.left = '24px';
    } else {
      btn.style.right = '24px';
    }
    btn.style.bottom = '24px';

    btn.style.width = '60px';
    btn.style.height = '60px';
    btn.style.borderRadius = '50%';
    btn.style.background = '#2563eb';
    btn.style.color = '#fff';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 10px 25px rgba(15,23,42,0.35)';
    btn.style.zIndex = '99999';
    btn.style.fontSize = '26px';
    btn.style.userSelect = 'none';
    btn.innerText = '💬';

    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var iframe = document.getElementById('dunyatek-chatbot-iframe');
      if (iframe) {
        iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
        return;
      }

      iframe = document.createElement('iframe');
      iframe.id = 'dunyatek-chatbot-iframe';

      var botId = config.botId || '';
    var url = 'https://dunyatekchatbot.netlify.app/widget.html';
        if (botId) {
        url += '?botId=' + encodeURIComponent(botId);
     }
      iframe.src = url;

      iframe.style.position = 'fixed';
      if (position.indexOf('left') !== -1) {
        iframe.style.left = '24px';
      } else {
        iframe.style.right = '24px';
      }
      iframe.style.bottom = '96px';
      iframe.style.width = '400px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 10px 30px rgba(15,23,42,0.35)';
      iframe.style.zIndex = '99999';
      iframe.allow = 'clipboard-write; microphone;';

      document.body.appendChild(iframe);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createLauncher);
  } else {
    createLauncher();
  }
})();
