// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Обработчик события готовности
tg.ready();

// Можно добавить дополнительную логику здесь
console.log("Mini App loaded successfully");

// Добавим анимацию появления текста
document.addEventListener('DOMContentLoaded', function() {
    const welcomeText = document.querySelector('.glowing-text');
    welcomeText.style.opacity = '0';
    welcomeText.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        welcomeText.style.opacity = '1';
    }, 500);
});