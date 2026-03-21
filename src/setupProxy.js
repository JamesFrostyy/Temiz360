const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/sms',
    createProxyMiddleware({
      target: 'http://192.168.0.9:8082',
      changeOrigin: true,
      pathRewrite: {
        '^/api/sms': '/', // /api/sms gördüğün an bunu telefondaki / adresine çevir
      },
    })
  );
};