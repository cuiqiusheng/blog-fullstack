import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export function notificationTopic(userId: string) {
  return `NOTIFICATION:${userId}`;
}
