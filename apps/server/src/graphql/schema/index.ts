import fs from 'fs';
import path from 'path';

const SCHEMA_DIR = path.join(__dirname, '.');

function loadGraphQL(filename: string): string {
  const filepath = path.join(SCHEMA_DIR, filename);
  return fs.readFileSync(filepath, 'utf-8');
}

/**
 * Schema SDL loaded from .graphql files (base + domain modules).
 * Used by Apollo Server and by codegen for type generation.
 */
export const typeDefs = [
  loadGraphQL('base.graphql'),
  loadGraphQL('auth.graphql'),
  loadGraphQL('ai.graphql'),
  loadGraphQL('chat.graphql'),
  loadGraphQL('post.graphql'),
  loadGraphQL('interaction.graphql'),
  loadGraphQL('notification.graphql'),
  loadGraphQL('follow.graphql'),
];
