import { detailedEventsQuerySelector } from "../selectors";
import prisma from "./prisma";

// Context: From the homepage
export function activeCarpools(userId: number) {
	const now = new Date();
	return prisma.carpool.findMany({
		select: {
			id: true,
			members: {
				select: {
					id: true,
					name: true,
				},
			},
			event: {
				select: {
					id: true,
					name: true,
					startTime: true,
					duration: true,
					endTime: true,
					formattedAddress: true,
					group: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		where: {
			members: {
				some: {
					id: userId,
				},
			},
			event: {
				endTime: { gte: now },
			},
		},
	});
}

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

export function activeEvents(userId: number) {
	return prisma.event.findMany({
		...detailedEventsQuerySelector,
		// where some of the group's users have the id `userId`
		where: {
			group: {
				users: {
					some: {
						id: userId,
					},
				},
			},
			endTime: {
				lt: new Date(),
			},
		},
	});
}

export function allEvents(userId: number) {
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

// Returns requests sent by a user
export async function requestsFromUser(id: number) {
	const requests = await prisma.invitation.findMany({
		select: {
			user: {
				select: {
					id: true,
					name: true,
				},
			},
			carpool: {
				select: {
					id: true,
					name: true,
				},
			},
			sentTime: true,
			isRequest: true,
		},
		where: {
			userId: id,
			isRequest: true,
		},
	});

	return requests;
}

export async function invitationsToUser(id: number) {
	const invitations = await prisma.invitation.findMany({
		select: {
			user: {
				select: {
					id: true,
					name: true,
				},
			},
			carpool: {
				select: {
					id: true,
					name: true,
				},
			},
			sentTime: true,
			isRequest: true,
		},
		where: {
			userId: id,
			isRequest: false,
		},
	});

	return invitations;
}

// Returns requests sent to a user
export async function requestsToUser(id: number) {
	const requests = await prisma.invitation.findMany({
		select: {
			user: {
				select: {
					id: true,
					name: true,
				},
			},
			carpool: {
				select: {
					id: true,
					name: true,
				},
			},
			sentTime: true,
			isRequest: true,
		},
		where: {
			carpool: {
				members: {
					some: {
						id,
					},
				},
			},
			isRequest: true,
		},
	});

	return requests;
}

// Returns invitations sent to a user
export async function invitationsFromUser(id: number) {
	const invitations = await prisma.invitation.findMany({
		select: {
			user: {
				select: {
					id: true,
					name: true,
				},
			},
			carpool: {
				select: {
					id: true,
					name: true,
				},
			},
			sentTime: true,
			isRequest: true,
		},
		where: {
			carpool: {
				members: {
					some: {
						id,
					},
				},
			},
		},
	});

	return invitations;
}
