import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer, HeaderMap } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';

dotenv.config();

const app = express();

// global middleware
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  });
});

// ApolloServer will be created in startServer function

export async function startServer() {
  const httpServer = http.createServer(app);
  
  // TODO: import typeDefs and resolvers
  // import { typeDefs } from './graphql/schema';
  // import { resolvers } from './graphql/resolvers';
  
  const apolloServer = new ApolloServer({
    typeDefs: `#graphql
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello from GraphQL!',
      },
    },
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
      context: async () => {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];
        return { token };
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
