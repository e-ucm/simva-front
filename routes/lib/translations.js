module.exports={
    getLogoutTranslations(req) { 
        return {
            title : req.t('title'), 
            contact : req.t('contactButton'), 
            login : req.t('loginButton'), 
            QA : req.t('QAButton'), 
            GDPR : req.t('GDPRButton'), 
            eUCMResearch : req.t('eUCMResearchButton'),
            about : req.t('aboutButton')
        }
    }
};