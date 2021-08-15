import { AssertionError } from "assert";
import {
	calculateRecurringEventEndTime,
	calculateSingleEventEndTime,
} from "../datetime";
import { getPlaceDetails } from "../googlemaps";
import {
	carpoolsQuerySelector,
	detailedEventsQuerySelector,
	signupsQuerySelector,
} from "../selectors";
import prisma from "./prisma";

const EVENT_FEED_QUERY_TAKE_AMOUNT = 10;

export async function mostRecentForUser(
	userId: number,
	last: { endTime: Date; id: number } | null
) {
	return await prisma.event.findMany({
		...detailedEventsQuerySelector,
		where: {
			AND: [
				{
					// Verify the event is visible by the user
					OR: [
						{ group: { users: { some: { id: userId } } } },
						{ signups: { some: { userId } } },
						{ creatorId: userId },
					],
				},
				last
					? {
							// Verify the event is after the cursor
							OR: [
								// If the end times are equivalent, take events in descending order by id
								{ endTime: last.endTime, id: { lt: last.id } },
								// If the end times are not equivalent, take events in descending order by endTime
								{ endTime: { lt: last.endTime } },
							],
					  }
					: {},
			],
			...(last ? { endTime: { lt: last.endTime } } : {}),
		},
		orderBy: [{ endTime: "desc" }, { id: "desc" }],
		take: EVENT_FEED_QUERY_TAKE_AMOUNT,
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
	description: string;
};

export type EventUpdate = Partial<Omit<EventInit, "groupId">>;

function assertValidDuration(duration: number) {
	if (duration < 0) {
		throw new AssertionError({ message: "duration cannot be negative" });
	}
}

async function getValidPlaceDetails(placeId: string) {
	const placeDetails = await getPlaceDetails(placeId);
	if (placeDetails == null) {
		throw new Error("invalid placeId");
	}
	return placeDetails;
}

function calculateEndTime({
	daysOfWeek,
	endDate,
	startTime,
	duration,
}: {
	daysOfWeek: number;
	endDate: Date;
	startTime: Date;
	duration: number;
}) {
	const recurring = daysOfWeek !== 0;
	if (!recurring) {
		return calculateSingleEventEndTime(startTime, duration);
	} else {
		return calculateRecurringEventEndTime(startTime, duration, endDate);
	}
}

export async function update(eventId: number, eventUpdate: EventUpdate) {
	const { name, startTime, duration, endDate, placeId, daysOfWeek } =
		eventUpdate;

	assertValidDuration(duration);
	const { latitude, longitude, formattedAddress } = await getValidPlaceDetails(
		placeId
	);

	let endTime: Date | undefined = undefined;
	const isEventTimingUpdated = !!(
		daysOfWeek ||
		duration ||
		endDate ||
		startTime
	);
	if (isEventTimingUpdated) {
		const existingEventTiming = await prisma.event.findFirst({
			select: {
				daysOfWeek: true,
				duration: true,
				startTime: true,
				endTime: true,
			},
			where: { id: eventId },
		});
		const newEventTiming = {
			daysOfWeek: daysOfWeek ?? existingEventTiming.daysOfWeek,
			duration: duration ?? existingEventTiming.duration,
			startTime: startTime ?? existingEventTiming.startTime,
			endDate: endDate ?? existingEventTiming.endTime,
		};
		endTime = calculateEndTime(newEventTiming);
	}

	return await prisma.event.update({
		where: {
			id: eventId,
		},
		data: {
			name,

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

export async function create(eventInit: EventInit, creatorId: number) {
	const { name, startTime, duration, endDate, groupId, placeId, daysOfWeek } =
		eventInit;

	assertValidDuration(duration);
	const { latitude, longitude, formattedAddress } = await getValidPlaceDetails(
		placeId
	);
	const endTime = calculateEndTime(eventInit);

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

			creator: {
				connect: {
					id: creatorId,
				},
			},

			daysOfWeek,

			placeId,
			latitude,
			longitude,
			formattedAddress,
		},
	});
}

export async function signupsBulk(id: number, userIds: number[]) {
	return await prisma.eventSignup.findMany({
		...signupsQuerySelector,
		where: {
			eventId: id,
			userId: {
				in: userIds,
			},
		},
	});
}

export async function signups(id: number) {
	const signups = await prisma.eventSignup.findMany({
		...signupsQuerySelector,
		where: {
			eventId: id,
		},
	});

	return signups;
}

export async function get(eventId: number) {
	const event = await prisma.event.findFirst({
		...detailedEventsQuerySelector,
		where: {
			id: eventId,
		},
	});
	if (!event) {
		return null;
	}
	const signupMap = {};
	for (const signup of event.signups) {
		signupMap[signup.user.id] = signup;
	}
	return {
		...event,
		signups: signupMap,
	};
}

export async function cancel(eventId: number) {
	// Cancel the event. Sets the 'cancelled' field to true.
	await prisma.event.update({
		...detailedEventsQuerySelector,
		where: {
			id: eventId,
		},
		data: {
			cancelled: true,
		},
	});
}

async function delete_(eventId: number) {
	return await prisma.event.delete({
		where: {
			id: eventId,
		},
	});
}

export { delete_ as delete };
