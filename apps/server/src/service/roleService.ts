import { prisma } from '@/lib/prisma';

export async function createRole(name: string, description?: string) {
  return prisma.role.create({
    data: { name, description },
  });
}

export async function assignRoleToUser(userId: string, roleId: string) {
  return prisma.userRole.create({
    data: { userId, roleId },
  });
}

export async function getUserRoles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });
}

export async function getRoleUsers(roleId: string) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: { users: true },
  });
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  return prisma.userRole.delete({
    where: { userId_roleId: { userId, roleId } },
  });
}
