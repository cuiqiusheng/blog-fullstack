import { useQuery } from '@apollo/client/react';
import { MeDocument } from '@/graphql/codegen';

export function useCurrentUser() {
  const { data, loading } = useQuery(MeDocument, {
    fetchPolicy: 'cache-first',
  });

  return {
    currentUser: data?.me ?? null,
    loading,
  };
}
