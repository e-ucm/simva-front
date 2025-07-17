module.exports = function(auth, config){
  const defaultLanguage="en";
  const languages = [
		{ name: 'English', code : 'en', flag: 'us' },
		{ name: 'Spanish', code : 'es', flag: 'es' },
		{ name: 'French', code : 'fr', flag: 'fr' },
    { name: 'Portuguese (Brasil)', code : 'pt-BR', flag: 'br' },
		// ... https://flagpedia.net/data/flags/w1160/${flagCode}.webp // https://flaglog.com/codes/official-ratio-120px/${flagCode}.png
	];

  var express = require('express');
  router = express.Router();
  router.post('/:lng', function(req, res, next) {
    const lng = req.params["lng"];  // Get the new language from query parameters
    res.cookie('i18next', lng, { maxAge: 900000, httpOnly: true });  // Set the new language in a cookie
    res.status(200).send({ message : "Language updated" });
  });

  router.get('/', function(req, res, next) {
    res.status(200).send({ current : req.cookies.i18next, default: defaultLanguage, languages : languages, flagTemplateUrl : 'https://flagpedia.net/data/flags/w1160/${flagCode}.webp', replaceVariable : '${flagCode}' });
  });
  return router;
}