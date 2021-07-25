import { Invitation } from "@prisma/client";
import { sendInvitedToCarpoolEmail } from "../email";
import { NotFound } from "../errors";
import prisma from "./prisma";

export async function invitationsAndRequests(
	carpoolId: number
): Promise<Invitation[]> {
	return await prisma.invitation.findMany({
		where: { carpoolId },
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
	return await prisma.carpool.findFirst({
		select: {
			id: true,
			name: true,
			event: {
				select: {
					id: true,
					name: true,
					formattedAddress: true,
					latitude: true,
					longitude: true,
					placeId: true,
				},
			},
			members: {
				select: {
					id: true,
					name: true,
				},
			},
			invitations: {
				select: {
					user: {
						select: {
							id: true,
							name: true,
						},
					},
					sentTime: true,
					isRequest: true,
				},
			},
		},
		where: {
			id,
		},
	});
}

export type CarpoolInit = {
	name: string;
	userId: number;
	eventId: number;
	invitedUserIds?: number[];
};

export async function create({
	name,
	userId,
	eventId,
	invitedUserIds,
}: CarpoolInit) {
	const carpool = await prisma.carpool.create({
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
			invitations: {
				create: invitedUserIds?.map((inviteeId) => ({
					isRequest: false,
					sentTime: new Date(),
					userId: inviteeId,
				})),
			},
		},
	});

	for (let inviteeId of invitedUserIds) {
		sendInvitedToCarpoolEmail(inviteeId, carpool.id);
	}

	return carpool;
}

async function delete_(carpoolId: number) {
	return await prisma.carpool.delete({
		where: {
			id: carpoolId,
		},
	});
}

export { delete_ as delete };

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
		// First, all invitations must be removed
		await prisma.invitation.deleteMany({
			where: {
				carpoolId,
			},
		});
		// Then, the carpool can be deleted
		await prisma.carpool.delete({
			where: {
				id: carpoolId,
			},
		});
	}
}

export async function potentialInvitees(carpoolId: number) {
	const carpool = await prisma.carpool.findFirst({
		where: { id: carpoolId },
		select: { eventId: true },
	});

	if (!carpool) {
		throw new NotFound();
	}

	const { eventId } = carpool;

	const signups = await prisma.eventSignup.findMany({
		select: {
			user: {
				select: {
					id: true,
					name: true,
				},
			},
			latitude: true,
			longitude: true,
		},
		where: { eventId },
	});

	// All members in any carpool for this event
	const carpools = await prisma.carpool.findMany({
		select: {
			members: {
				select: {
					id: true,
				},
			},
		},
		where: {
			eventId,
		},
	});

	const unavailableMemberIds = carpools.reduce((prev, curr) => {
		curr.members.forEach((member) => prev.add(member.id));
		return prev;
	}, new Set<number>());

	const availableMembers = signups.reduce((prev, curr) => {
		if (!unavailableMemberIds.has(curr.user.id)) {
			prev.push(curr);
		}
		return prev;
	}, [] as Array<typeof signups[0]>);

	return availableMembers;
}
