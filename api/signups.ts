import prisma from "./prisma";

export function update({
  eventId,
  userId,
  formattedAddress,
  longitude,
  latitude,
  placeId,
}: {
  eventId: number;
  userId: number;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
}) {
  return prisma.eventSignup.create({
    data: {
      event: {
        connect: {
          id: eventId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      formattedAddress,
      latitude,
      longitude,
      placeId,
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
