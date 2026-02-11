import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        roles {
          id
          name
        }
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user {
        id
        email
        roles {
          id
          name
        }
      }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      roles {
        id
        name
      }
    }
  }
`;
