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

  const shutdown = () => {
    stopScheduler();
    httpServer.close(() => {
      logger.info({ msg: 'Server stopped gracefully' });
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  logger.fatal({ err }, 'Server failed to start');
  process.exit(1);
});
