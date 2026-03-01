export function getDisplayName(user: { nickname?: string | null; email: string }): string {
  return user.nickname || user.email.split('@')[0];
}
