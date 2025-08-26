const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');
const config = require('../../config.js');

i18next
  .use(Backend)                     // Connects the file system 
  .use(middleware.LanguageDetector) // Enables automatic language detection
  .init({
    debug: config.i18n.debug,
    fallbackLng: 'en', // Default language
    ns: ['commons', 'groups', 'studies', 'activities', 'about', 'roles', 'allocators'],           // 👈 specify your namespace(s)
    defaultNS: 'commons',                                                                         // 👈 set default namespace
    backend: {
      loadPath: path.join(process.cwd(), 'locales', '{{lng}}', '{{ns}}.json'), // Path to translation files
    },
    interpolation: { prefix: '{{', suffix: '}}', escapeValue: false },
    detection: {
      order: ['querystring', 'cookie'], // Priority: URL query string first, then cookies
      caches: ['cookie'],               // Cache detected language in cookies
    },
  });

module.exports = i18next;
