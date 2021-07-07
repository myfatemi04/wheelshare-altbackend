import { getPlaceDetails, PlaceDetails } from "../googlemaps";
import prisma from "./prisma";

export async function update({
  eventId,
  userId,
  placeId,
}: {
  eventId: number;
  userId: number;
  placeId: string | null;
}) {
  let details: PlaceDetails | {} = {};
  if (typeof placeId === "string") {
    details = await getPlaceDetails(placeId);
    if (!details) {
      throw new Error("placeid was invalid");
    }
  }

  return await prisma.eventSignup.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    create: {
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
      placeId,
      ...details,
    },
    update: {
      placeId,
      ...details,
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
