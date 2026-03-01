import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './src/graphql/schema/*.graphql',
  generates: {
    './src/graphql/__generated__/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../../types/context#GraphQLContext',
        useIndexSignature: true,
        mappers: {
          Post: '../types.mapper#PostParent',
          Comment: '../types.mapper#CommentParent',
          Notification: '../types.mapper#NotificationParent',
        },
        enumValues: {
          NotificationType: '../../generated/prisma/client#NotificationType',
        },
      },
    },
  },
};

export default config;
