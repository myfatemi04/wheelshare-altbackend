import { Invitation } from "@prisma/client";
import prisma from "./prisma";

/**
 * Creates a single-user carpool and returns the id of the created carpool
 */
// eslint-disable-next-line
async function createAndInviteUser(
	eventId: number,
	creatorId: number,
	inviteeId: number
) {
	// Check if a carpool already exists
	const existingCarpool = await prisma.carpool.findFirst({
		select: { id: true },
		where: { members: { some: { id: creatorId } } },
	});

	return await prisma.invitation.create({
		select: {
			carpoolId: true,
		},
		data: {
			// Create the carpool
			carpool: !existingCarpool
				? {
						create: {
							name: "Carpool",
							members: {
								// Add the initial members
								connect: [{ id: creatorId }, { id: inviteeId }],
							},
							event: {
								connect: {
									id: eventId,
								},
							},
						},
				  }
				: {
						connect: {
							id: existingCarpool.id,
						},
				  },
			isRequest: false,
			sentTime: new Date(),
			// Invite the user
			user: {
				connect: {
					id: inviteeId,
				},
			},
		},
	});
}

export async function invitationsAndRequests(
	carpoolId: number
): Promise<Invitation[]> {
	return await prisma.invitation.findMany({
		where: { carpoolId },
	});
}

export async function isModerator(
	carpoolId: number,
	memberId: number
): Promise<boolean> {
	return await isMember(carpoolId, memberId);
}

export async function isMember(carpoolId: number, memberId: number) {
	const count = await prisma.carpool.count({
		where: {
			id: carpoolId,
			members: {
				some: {
					id: memberId,
				},
			},
		},
	});
	return count > 0;
}

/**
 * Returns true if the carpool is in a group that the user is in.
 */
export async function visibleToUser(carpoolId: number, userId: number) {
	await prisma.group.count({
		where: {
			// Where this carpool's event exists
			events: {
				some: {
					carpools: {
						some: {
							id: carpoolId,
						},
					},
				},
			},
			users: {
				some: {
					id: userId,
				},
			},
		},
	});
}

export async function active(id: number) {
	const active = await prisma.carpool.findMany({
		where: {
			members: {
				some: {
					id,
				},
			},
			event: {
				endTime: {
					lt: new Date(),
				},
			},
		},
	});

	return active;
}

export async function get(id: number) {
	const carpool = await prisma.carpool.findFirst({
		where: {
			id,
		},
	});

	return carpool;
}

export type CarpoolInit = {
	name: string;
	userId: number;
	eventId: number;
};

export async function create({ name, userId, eventId }: CarpoolInit) {
	return await prisma.carpool.create({
		select: {
			id: true,
		},
		data: {
			name,
			members: {
				connect: {
					id: userId,
				},
			},
			event: {
				connect: {
					id: eventId,
				},
			},
		},
	});
}

export async function delete_pool(carpoolId: number, userId: number) {
	if (isModerator(carpoolId, userId)) {
		return await prisma.carpool.delete({
			where: {
				id: carpoolId,
			},
		});
	}
}

export async function leave(carpoolId: number, userId: number) {
	const { members } = await prisma.carpool.update({
		where: {
			id: carpoolId,
		},
		select: {
			members: {
				take: 1,
			},
		},
		data: {
			members: {
				disconnect: {
					id: userId,
				},
			},
		},
	});
	if (members.length === 0) {
		// Delete the carpool when all members have left
		await prisma.carpool.delete({
			where: {
				id: carpoolId,
			},
		});
	}
}
