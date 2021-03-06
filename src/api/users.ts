import {
	detailedEventsQuerySelector,
	userPreviewQuerySelector,
} from "../selectors";
import prisma from "./prisma";

/**
 * Creates a new user based on a name and email, returning the ID of the newly-created user.
 */
export async function createUser({
	name,
	email,
}: {
	name: string;
	email: string;
}): Promise<number> {
	const { id } = await prisma.user.create({
		select: {
			id: true,
		},
		data: {
			name,
			email,
		},
	});
	return id;
}

export async function getUserProfileForSelf(id: number) {
	return await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			bio: true,
			email: true,
		},
		where: {
			id,
		},
	});
}

export async function getUserProfileForPeer(id: number) {
	return await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			bio: true,
			email: true, // TODO remove?
		},
		where: {
			id,
		},
	});
}

export async function getUserByEmail(email: string) {
	return await prisma.user.findFirst({
		where: { email },
	});
}

export async function updateUserBio(id: number, bio: string) {
	return await prisma.user.update({
		where: {
			id,
		},
		data: {
			bio,
		},
	});
}

// Context: From the homepage
export function activeCarpools(userId: number) {
	const now = new Date();
	return prisma.carpool.findMany({
		select: {
			id: true,
			name: true,
			members: userPreviewQuerySelector,
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
		select: {
			id: true,
			name: true,
		},
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
	const now = new Date();
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
			endTime: { gte: now },
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
			user: userPreviewQuerySelector,
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
			user: userPreviewQuerySelector,
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
			user: userPreviewQuerySelector,
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
				creatorId: id,
			},
			isRequest: true,
		},
	});

	return requests;
}

// Returns invitations sent by a user
export async function invitationsFromUser(id: number) {
	const invitations = await prisma.invitation.findMany({
		select: {
			user: userPreviewQuerySelector,
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

export async function canViewEvent(
	eventId: number,
	userId: number
): Promise<boolean> {
	return true;

	/*

	// Find a group that the user is a member of which has the same event.
	const group = await prisma.group.findFirst({
		select: { id: true },
		where: {
			events: {
				some: {
					id: eventId,
				},
			},
			users: {
				some: {
					id: userId,
				},
			},
		},
	});

	return group !== null;

	*/
}

export async function isEventCreator(
	eventId: number,
	userId: number
): Promise<boolean> {
	const event = await prisma.event.findFirst({
		where: {
			id: eventId,
		},
		select: {
			creatorId: true,
		},
	});

	return event !== null && event.creatorId === userId;
}

export async function canSignUpForEvent(eventId: number, userId: number) {
	const event = await prisma.event.findFirst({
		where: {
			id: eventId,
		},
		select: {
			creatorId: true,
			groupId: true,
		},
	});

	if (event.creatorId === userId) {
		return true;
	}

	if (event.groupId !== null) {
		// There is a group for the event...
		const group = await prisma.group.findFirst({
			select: { id: true },
			where: {
				id: event.groupId,
				users: {
					some: {
						id: userId,
					},
				},
			},
		});

		// Check if a group with this user as a member exists
		if (group !== null) {
			return true;
		}
	}

	return false;
}

export async function canModifyEvent(
	eventId: number,
	userId: number
): Promise<boolean> {
	return await isEventCreator(eventId, userId);
}

export async function canAddCarpoolToEvent(
	eventId: number,
	userId: number
): Promise<boolean> {
	return await canViewEvent(eventId, userId);
}

async function isAdminOfGroupContainingEvent(eventId: number, userId: number) {
	const group = await prisma.group.findFirst({
		where: {
			events: {
				some: {
					id: eventId,
				},
			},
			admins: {
				some: {
					id: userId,
				},
			},
		},
	});

	return group !== null;
}

export async function canDeleteEvent(
	eventId: number,
	userId: number
): Promise<boolean> {
	return (
		(await isEventCreator(eventId, userId)) ||
		(await isAdminOfGroupContainingEvent(eventId, userId))
	);
}

export async function isGroupMember(
	groupId: number,
	userId: number
): Promise<boolean> {
	const group = await prisma.group.findFirst({
		select: {
			id: true,
		},
		where: {
			id: groupId,
			users: {
				some: {
					id: userId,
				},
			},
		},
	});

	return group !== null;
}

export async function isGroupAdmin(
	groupId: number,
	userId: number
): Promise<boolean> {
	const group = await prisma.group.findFirst({
		select: {
			id: true,
		},
		where: {
			id: groupId,
			admins: {
				some: {
					id: userId,
				},
			},
		},
	});

	return group !== null;
}

// True if the user is a member of the group
export async function canCreateEventInGroup(
	groupId: number,
	userId: number
): Promise<boolean> {
	return await isGroupMember(groupId, userId);
}

export async function canModerateGroupMembers(groupId: number, userId: number) {
	return await isGroupAdmin(groupId, userId);
}

export async function canGenerateJoinCode(groupId: number, userId: number) {
	return await canModerateGroupMembers(groupId, userId);
}

export async function canResetJoinCode(groupId: number, userId: number) {
	return await canModerateGroupMembers(groupId, userId);
}

export async function canViewGroup(groupId: number, userId: number) {
	return await isGroupMember(groupId, userId);
}

export async function canDeleteGroup(groupId: number, userId: number) {
	return await isGroupAdmin(groupId, userId);
}

export async function canAddAdmins(groupId: number, userId: number) {
	return await isGroupAdmin(groupId, userId);
}

export async function canRemoveAdmins(groupId: number, userId: number) {
	return await isGroupAdmin(groupId, userId);
}

/**
 * Returns true if the carpool is in a group that the user is in.
 */
export async function canViewCarpool(carpoolId: number, userId: number) {
	const count = await prisma.group.count({
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

	return count > 0;
}

export async function isCarpoolMember(carpoolId: number, userId: number) {
	const count = await prisma.carpool.count({
		where: {
			id: carpoolId,
			members: {
				some: {
					id: userId,
				},
			},
		},
	});
	return count > 0;
}

export async function isCarpoolCreator(carpoolId: number, userId: number) {
	const carpool = await prisma.carpool.findFirst({
		where: {
			id: carpoolId,
			creatorId: userId,
		},
	});
	return carpool !== null;
}

export async function canSetCarpoolNote(carpoolId: number, userId: number) {
	return await isCarpoolCreator(carpoolId, userId);
}

export async function canManageCarpoolRequests(
	carpoolId: number,
	userId: number
) {
	return await isCarpoolCreator(carpoolId, userId);
}

export async function canManageCarpoolInvites(
	carpoolId: number,
	userId: number
) {
	return await isCarpoolCreator(carpoolId, userId);
}

export async function canViewCarpoolInvitesAndRequests(
	carpoolId: number,
	userId: number
) {
	return await isCarpoolCreator(carpoolId, userId);
}

export async function canDeleteCarpool(carpoolId: number, userId: number) {
	return await isCarpoolCreator(carpoolId, userId);
}
