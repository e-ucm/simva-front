const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

i18next
  .use(Backend)                     // Connects the file system 
  .use(middleware.LanguageDetector) // Enables automatic language detection
  .init({
    debug: true,
    fallbackLng: 'en', // Default language
    preload: ['en', 'fr'], // Preload supported languages
    backend: {
      loadPath: path.join(process.cwd(), 'locales', '{{lng}}', '{{ns}}.json'), // Path to translation files
    },
    detection: {
      order: ['querystring', 'cookie'], // Priority: URL query string first, then cookies
      caches: ['cookie'],               // Cache detected language in cookies
    },
  });

module.exports = i18next;
