/**
 * Utilitaire pour standardiser les réponses API
 */
class ApiResponse {
  static success(res, data = null, message = 'Succès', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = 'Erreur', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res, message = 'Ressource non trouvée') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'Non autorisé') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Accès interdit') {
    return this.error(res, message, 403);
  }

  static badRequest(res, message = 'Requête invalide', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static created(res, data = null, message = 'Créé avec succès') {
    return this.success(res, data, message, 201);
  }
}

module.exports = ApiResponse;

