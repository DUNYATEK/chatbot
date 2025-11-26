<?php
/**
 * Plugin Name: Dunyatek Chatbot
 * Description: Dunyatek yapay zeka sohbet botu için basit WordPress eklentisi.
 * Version: 1.0.0
 * Author: Dunyatek
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // direct access engelle
}

/**
 * Widget JS dosyasını ve config'i siteye ekle
 */
function dunyatek_chatbot_enqueue_scripts() {

    // Tüm sitede kullanmak isteyip istemediğini kontrol etmek istersen
    // buraya koşul eklenebilir. Şimdilik her sayfada yüklüyoruz.
    wp_register_script(
        'dunyatek-chatbot-widget',
        'https://dunyatekchatbot.netlify.app/widget.js', // Netlify widget.js adresin
        array(), // bağımlılık yok
        null,    // versiyon
        true     // footer'da yüklensin
    );

    wp_enqueue_script( 'dunyatek-chatbot-widget' );

    // Basit konfigürasyon – şimdilik sabit, sonra admin ayarlarına taşıyabiliriz
    $config = array(
        'botId'    => '123',          // Burayı kendi bot ID'n ile değiştir
        'position' => 'right-bottom', // widget.js içinde kullanılıyor
    );

    // window.DUNYATEK_CHATBOT_CONFIG globalini doldur
    wp_add_inline_script(
        'dunyatek-chatbot-widget',
        'window.DUNYATEK_CHATBOT_CONFIG = ' . wp_json_encode( $config ) . ';',
        'before' // script'ten önce yaz
    );
}
add_action( 'wp_enqueue_scripts', 'dunyatek_chatbot_enqueue_scripts' );

/**
 * [dunyatek_chatbot] shortcode'u
 * Bu shortcode kullanıldığı sayfada, widget'in kök div'ini oluşturur.
 */
function dunyatek_chatbot_shortcode() {
    return '<div id="dunyatek-chatbot-root"></div>';
}
add_shortcode( 'dunyatek_chatbot', 'dunyatek_chatbot_shortcode' );