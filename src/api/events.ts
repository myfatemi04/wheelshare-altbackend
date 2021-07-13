import { AssertionError } from "assert";
import api from ".";
import {
  calculateRecurringEventEndTime,
  calculateSingleEventEndTime,
} from "../datetime";
import { getPlaceDetails } from "../googlemaps";
import prisma from "./prisma";

export async function all() {
  return await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      groupId: true,
      group: true,
      startTime: true,
      duration: true,
      endTime: true,
      daysOfWeek: true,
      placeId: true,
      formattedAddress: true,
      latitude: true,
      longitude: true,
      signups: true,
      carpools: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
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
    select: {
      latitude: true,
      longitude: true,
      placeId: true,
      formattedAddress: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    where: {
      eventId: id,
    },
  });

  return signups;
}

export async function get(eventId: number) {
  return await prisma.event.findFirst({
    select: {
      id: true,
      name: true,
      groupId: true,
      group: true,
      startTime: true,
      duration: true,
      endTime: true,
      daysOfWeek: true,
      placeId: true,
      formattedAddress: true,
      latitude: true,
      longitude: true,
      signups: true,
      carpools: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    where: {
      id: eventId
    }
  });

  //return {
  //  event,
  //  alreadyInCarpool: alreadyInCarpool(eventId, userId)
 // };
}

//export async function alreadyInCarpool(eventId: number, userId: number) {
//  const event = prisma.event.findFirst({
//    where: {
//      id: eventId
//    }
//  });

//  for(let i = 0; i < event.carpools.length; i++) {
//    if(api.carpools.isMember(event.carpools[i].id, userId)) {
//      return true;
//    }
//  }
//  return false;
//}