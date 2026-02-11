import { startServer } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const httpServer = await startServer();

  httpServer.listen(PORT, () => {
    logger.info({
      msg: 'Server started',
      port: PORT,
      health: `http://localhost:${PORT}/health`,
      graphql: `http://localhost:${PORT}/graphql`,
      env: process.env.NODE_ENV,
    });
  });
}

bootstrap().catch(err => {
  logger.fatal({ err }, 'Server failed to start');
  process.exit(1);
});
