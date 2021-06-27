import { getPlaceDetails } from "../googlemaps";
import prisma from "./prisma";

export async function getAll() {
  return await prisma.event.findMany({
    orderBy: {
      endTime: "desc",
    },
  });
}

export async function create({
  name,
  startTime,
  endTime,
  groupId,
  placeId,
}: {
  name: string;
  startTime: Date;
  endTime: Date;
  groupId: number;
  placeId: string;
}) {
  const placeDetails = await getPlaceDetails(placeId);
  if (placeDetails == null) {
    throw new Error("invalid placeId");
  }
  const { latitude, longitude, formattedAddress } = placeDetails;
  return await prisma.event.create({
    select: {
      id: true,
    },
    data: {
      name,
      startTime,
      endTime,
      group: {
        connect: {
          id: groupId,
        },
      },
      placeId,
      latitude,
      longitude,
      formattedAddress,
    },
  });
}
