import prisma from "./prisma";

export function groups(userId: number) {
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

export function allEvents(userId: number) {
  return prisma.event.findMany({
    // where some of the group's users have the id `userId`
    where: {
      AND: [
        {
          group: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
        {
          OR: [
            {
              endTime: {
                equals: null,
              },
            },
            {
              endTime: {
                lt: new Date(),
              },
            },
          ],
        },
      ],
    },
  });
}

export function activeEvents(userId: number) {
  return prisma.event.findMany({
    // where some of the group's users have the id `userId`
    where: {
      group: {
        users: {
          some: {
            id: userId,
          },
        },
      },
    },
  });
}
