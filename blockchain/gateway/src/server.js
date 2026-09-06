const { createApp } = require('./app');
const logger = require('./logger');

const app = createApp();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info('gateway.start', { port });
});
