const ApiResponse = require('../utils/response');

function errorHandler(err, req, res, next) {
    console.error(`[SERVER ERROR]: ${err.stack}`); // سجل الخطأ الكامل في الكونسول للمطور

    // أرسل استجابة خطأ 500 موحدة
    ApiResponse.error(res, "Une erreur inattendue est survenue sur le serveur.");
}

module.exports = errorHandler;