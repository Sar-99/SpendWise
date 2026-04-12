function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
}

module.exports = errorHandler;