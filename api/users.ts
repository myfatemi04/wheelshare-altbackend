import prisma from "./prisma";

export function getGroups(userId: number) {
  return prisma.group.findMany({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
  });
}
