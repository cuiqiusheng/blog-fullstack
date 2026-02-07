import { startServer } from './app';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const httpServer = await startServer();

  httpServer.listen(PORT, () => {
    console.log(`
      🚀 Server ready at: http://localhost:${PORT}
      📊 Health check: http://localhost:${PORT}/health
      🎯 GraphQL server: http://localhost:${PORT}/graphql
      ⏰ Started at: ${new Date().toISOString()}
      🌍 Environment: ${process.env.NODE_ENV}
    `);
  });
}

bootstrap().catch(console.error);
