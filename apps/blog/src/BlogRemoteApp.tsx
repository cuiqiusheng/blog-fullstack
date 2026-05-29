import { ApolloProvider } from '@apollo/client/react';

import '@/lib/i18n';

import App from './App';
import { apolloClient } from './lib/apollo';

export default function BlogRemoteApp() {
  return (
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  );
}
