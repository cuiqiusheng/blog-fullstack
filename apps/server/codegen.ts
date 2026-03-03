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
          PostNeighbors: '../types.mapper#PostNeighborsParent',
          Comment: '../types.mapper#CommentParent',
          Notification: '../types.mapper#NotificationParent',
          User: '../types.mapper#UserParent',
        },
        enumValues: {
          NotificationType: '../../generated/prisma/client#NotificationType',
        },
      },
    },
  },
};

export default config;
