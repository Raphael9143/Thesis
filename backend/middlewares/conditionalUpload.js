/**
 * Middleware factory: only apply multer when request Content-Type is multipart/form-data
 * Usage: const conditionalUpload = require('./conditionalUpload')(uploadInstance)
 * then use conditionalUpload in route definitions.
 */
module.exports = function (uploadInstance) {
  return function conditionalUpload(req, res, next) {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.startsWith('multipart/form-data')) {
      // use upload.any() so clients can use any field name
      return uploadInstance.any()(req, res, next);
    }
    return next();
  };
};
