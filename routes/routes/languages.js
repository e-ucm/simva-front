module.exports = function(auth, config){
  const defaultLanguage="en";
  const languages = [
		{ name: 'English', code : 'en', flag: 'https://flagpedia.net/data/flags/w1160/us.webp' },
		{ name: 'Spanish', code : 'es', flag: 'https://flagpedia.net/data/flags/w1160/es.webp' },
		{ name: 'French', code : 'fr', flag: 'https://flagpedia.net/data/flags/w1160/fr.webp' },
    { name: 'Portuguese (Brasil)', code : 'pt-BR', flag: 'https://flagpedia.net/data/flags/w1160/br.webp' },
		// ...
	];

  var express = require('express'),
  router = express.Router();
  router.post('/:languageid', function(req, res, next) {
    req.session.language=req.params["languageid"];
    res.status(200).send({ message : "Language updated in session" });
  });

  router.get('/', function(req, res, next) {
    if(req.session && !req.session.language) {
      req.session.language=defaultLanguage;
    } 
    res.status(200).send({ current : req.session.language, languages : languages, flagTemplateUrl : 'https://flaglog.com/codes/official-ratio-120px/${langCode}.png', replaceVariable : '${langCode}' });
  });
  return router;
}