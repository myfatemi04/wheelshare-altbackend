import prisma from "./prisma";

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
		// where some of the group's users have the id `userId`
		where: {
			AND: [
				{
					group: {
						users: {
							some: {
								id: userId,
							},
						},
					},
				},
				{
					OR: [
						{
							endTime: {
								equals: null,
							},
						},
						{
							endTime: {
								lt: new Date(),
							},
						},
					],
				},
			],
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

export async function sentRequests(id: number) {
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

export async function receivedInvitations(id: number) {
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

export async function receivedRequests(id: number) {
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

export async function sentInvitations(id: number) {
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
