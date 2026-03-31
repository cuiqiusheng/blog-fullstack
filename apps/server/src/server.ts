import 'dotenv/config';

import { startServer } from './app';
import { startArticleGenerationScheduler } from './service';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const httpServer = await startServer();
  const stopScheduler = startArticleGenerationScheduler();

  httpServer.listen(PORT, () => {
    logger.info({
      msg: 'Server started',
      port: PORT,
      health: `http://localhost:${PORT}/health`,
      graphql: `http://localhost:${PORT}/graphql`,
      env: process.env.NODE_ENV,
    });
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ msg: 'Shutting down...' });

    stopScheduler();

    const forceExit = setTimeout(() => {
      logger.warn({ msg: 'Graceful shutdown timed out, forcing exit' });
      process.exit(1);
    }, 5000);
    forceExit.unref();

    httpServer.close(() => {
      clearTimeout(forceExit);
      logger.info({ msg: 'Server stopped gracefully' });
      process.exit(0);
    });

    httpServer.closeAllConnections();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  logger.fatal({ err }, 'Server failed to start');
  process.exit(1);
});
