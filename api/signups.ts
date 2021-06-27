import prisma from "./prisma";

export function update(eventId: number, userId: number) {
  return prisma.eventSignup.create({
    data: {
      eventId,
      userId,
    },
  });
}

function delete_(eventId: number, userId: number) {
  return prisma.eventSignup.delete({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });
}

export { delete_ as delete };
