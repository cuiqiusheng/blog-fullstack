import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { getToken } from './auth';

const graphqlUri = import.meta.env.VITE_GRAPHQL_URI ?? '/api/graphql';

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

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
