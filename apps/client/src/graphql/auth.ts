/**
 * Auth operations: re-export from codegen output.
 * Use with Apollo: useQuery(MeDocument), useMutation(LoginDocument), useMutation(RegisterDocument).
 */
export {
  MeDocument,
  LoginDocument,
  RegisterDocument,
  type MeQuery,
  type MeQueryVariables,
  type LoginMutation,
  type LoginMutationVariables,
  type RegisterMutation,
  type RegisterMutationVariables,
} from './__generated__';
