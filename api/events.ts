import { AssertionError } from "assert";
import {
  calculateRecurringEventEndTime,
  calculateSingleEventEndTime,
} from "../datetime";
import { getPlaceDetails } from "../googlemaps";
import prisma from "./prisma";

export async function all() {
  return await prisma.event.findMany({
    orderBy: {
      endTime: "desc",
    },
  });
}

export type EventInit = {
  name: string;
  startTime: Date;
  duration: number;
  endDate: Date | null;
  groupId: number;
  placeId: string;
  daysOfWeek: number;
};

export async function create({
  name,
  startTime,
  duration,
  endDate,
  groupId,
  placeId,
  daysOfWeek,
}: EventInit) {
  if (duration < 0) {
    throw new AssertionError({ message: "duration cannot be negative" });
  }

  const placeDetails = await getPlaceDetails(placeId);
  if (placeDetails == null) {
    throw new Error("invalid placeId");
  }

  const { latitude, longitude, formattedAddress } = placeDetails;

  const recurring = daysOfWeek !== 0;
  let endTime: Date;
  if (!recurring) {
    endTime = calculateSingleEventEndTime(startTime, duration);
  } else {
    endTime = calculateRecurringEventEndTime(startTime, duration, endDate);
  }

  return await prisma.event.create({
    select: {
      id: true,
    },
    data: {
      name,
      group: {
        connect: {
          id: groupId,
        },
      },

      startTime,
      duration,
      endTime,

      daysOfWeek,

      placeId,
      latitude,
      longitude,
      formattedAddress,
    },
  });
}

export async function signups(id: number) {
  const signups = await prisma.eventSignup.findMany({
    where: {
      eventId: id,
    },
  });

  return signups;
}
