<?php
/**
 * Dunyatek Chatbot - PHP Entegrasyon Kodu
 * 
 * Bu dosya, PHP tabanlı web sitelerine Dunyatek Chatbot entegre etmek için kullanılır.
 * Aşağıdaki kodu sitenizin <body> etiketinden hemen önce ekleyin.
 * 
 * Kullanım:
 * <?php include_once 'path/to/this/file/widget.php'; ?>
 */

// Varsayılan ayarlar
$defaultConfig = [
    'botId' => 1, // Varsayılan bot ID
    'position' => 'right', // 'left' veya 'right'
    'buttonText' => '💬', // Buton metni veya emoji
    'buttonColor' => '#2563eb', // Buton rengi
    'autoInit' => true, // Otomatik başlatma
];

// Dışarıdan gelen ayarları birleştir
$config = array_merge($defaultConfig, isset($dunyatekChatbotConfig) ? $dunyatekChatbotConfig : []);

// JavaScript kodunu oluştur
$jsConfig = json_encode([
    'botId' => (int)$config['botId'],
    'position' => $config['position'],
    'buttonText' => $config['buttonText'],
    'buttonColor' => $config['buttonColor']
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

// Çıktıyı oluştur
?>
<!-- Dunyatek Chatbot Entegrasyonu Başlangıç -->
<div id="dunyatek-chatbot-container"></div>
<script>
  // Yapılandırmayı window üzerine ekle
  window.dunyatekChatbotConfig = <?php echo $jsConfig; ?>;
  
  // Widget yükleyici fonksiyonu
  function loadDunyatekChatbot() {
    var script = document.createElement('script');
    script.src = 'https://<?php echo $_SERVER['HTTP_HOST']; ?>/php-integration/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }
  
  // Sayfa yüklendiğinde widget'ı başlat
  if (<?php echo $config['autoInit'] ? 'true' : 'false'; ?>) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadDunyatekChatbot);
    } else {
      loadDunyatekChatbot();
    }
  }
</script>
<!-- Dunyatek Chatbot Entegrasyonu Sonu -->
