import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { getToken } from './auth';
import { createSessionErrorLink } from './apolloErrorLink';

const graphqlUri = import.meta.env.VITE_GRAPHQL_URI ?? '/api/graphql';

function resolveWsUri(uri: string): string {
  if (uri.startsWith('http://')) {
    return uri.replace('http://', 'ws://');
  }
  if (uri.startsWith('https://')) {
    return uri.replace('https://', 'wss://');
  }
  const path = uri.startsWith('/') ? uri : `/${uri}`;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

const authLink = new SetContextLink(prevContext => {
  const token = getToken();
  const headers = (prevContext.headers as Record<string, string>) ?? {};
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const httpLink = new HttpLink({ uri: graphqlUri });
// `connectionParams` runs on connect/reconnect; after logout or session invalidation the token is empty.
const wsLink = new GraphQLWsLink(
  createClient({
    url: resolveWsUri(graphqlUri),
    connectionParams: () => {
      const token = getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  }),
);

const httpChain = authLink.concat(httpLink);

const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpChain,
);

const apolloClientRef: { current: ApolloClient | null } = { current: null };
const sessionErrorLink = createSessionErrorLink(() => apolloClientRef.current!);

export const apolloClient = new ApolloClient({
  link: sessionErrorLink.concat(splitLink),
  cache: new InMemoryCache(),
});

apolloClientRef.current = apolloClient;
