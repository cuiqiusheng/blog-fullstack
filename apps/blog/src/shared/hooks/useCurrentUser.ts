import { useQuery } from '@apollo/client/react';
import { MeDocument } from '@/graphql/codegen';
import { useAuth } from './useAuth';

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery(MeDocument, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  return {
    currentUser: data?.me ?? null,
    loading,
  };
}
