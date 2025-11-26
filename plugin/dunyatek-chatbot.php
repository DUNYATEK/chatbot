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
 * Sitede widget.js dosyasını yükle
 */
function dunyatek_chatbot_enqueue_scripts() {
    wp_register_script(
        'dunyatek-chatbot-widget',
        'https://dunyatekchatbot.netlify.app/widget.js',
        array(),
        null,
        true
    );

    wp_enqueue_script( 'dunyatek-chatbot-widget' );
}
add_action( 'wp_enqueue_scripts', 'dunyatek_chatbot_enqueue_scripts' );

/**
 * [dunyatek_chatbot] shortcode'u
 * Örnek: [dunyatek_chatbot bot_id="123" position="right-bottom"]
 */
function dunyatek_chatbot_shortcode( $atts ) {
    $atts = shortcode_atts(
        array(
            'bot_id'   => '',
            'position' => 'right-bottom',
        ),
        $atts,
        'dunyatek_chatbot'
    );

    // Bu sayfa için config
    $config = array(
        'botId'    => (string) $atts['bot_id'],
        'position' => (string) $atts['position'],
    );

    $json = wp_json_encode( $config );

    // root div + inline script
    $html  = '<div id="dunyatek-chatbot-root"></div>' . PHP_EOL;
    $html .= '<script>window.DUNYATEK_CHATBOT_CONFIG = ' . $json . ';</script>' . PHP_EOL;

    return $html;
}
add_shortcode( 'dunyatek_chatbot', 'dunyatek_chatbot_shortcode' );