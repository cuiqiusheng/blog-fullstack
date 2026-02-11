import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer, HeaderMap } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import { createAuthContext } from './middleware/auth';
import { requestLogger } from './middleware/requestLogger';
import type { GraphQLContext } from './types/context';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

dotenv.config();

const app = express();

// global middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  });
});

export async function startServer() {
  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  const graphqlHandler = async (req: Request, res: Response) => {
    const headers = new HeaderMap();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      }
    });

    const httpGraphQLRequest = {
      method: req.method || 'POST',
      headers,
      search: new URL(req.url || '', `http://${req.headers.host}`).search,
      body: req.body,
    };

    const response = await apolloServer.executeHTTPGraphQLRequest({
      httpGraphQLRequest,
      context: async (): Promise<GraphQLContext> => {
        const auth = await createAuthContext(req);
        return { ...auth, req };
      },
    });

    if (response.body.kind === 'complete') {
      res.status(response.status || 200);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.send(response.body.string);
    } else {
      res.status(response.status || 200);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      for await (const chunk of response.body.asyncIterator) {
        res.write(chunk);
      }
      res.end();
    }
  };

  app.get('/graphql', graphqlHandler);
  app.post('/graphql', graphqlHandler);

  return httpServer;
}

export default app;
