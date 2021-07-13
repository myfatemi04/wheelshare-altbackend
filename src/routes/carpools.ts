import api from "../api";
import prisma from "../api/prisma";
import CustomRouter from "../customrouter";
import { T } from "../validate";

const carpools = new CustomRouter();

export default carpools;

carpools.get("/:id", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const requesterId: number = req.session.userId;
	const visible = api.carpools.visibleToUser(carpoolId, requesterId);
	if (!visible) {
		throw new Error("no access to carpool");
	}

	return await prisma.carpool.findFirst({
		select: {
			id: true,
			name: true,
			eventId: true,
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
			id: carpoolId,
		},
	});
});

carpools.delete("/:id/request", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const userId: number = req.session.id;
	await api.invitations.delete(userId, carpoolId);
});

carpools.post("/:id/request", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const requesterId: number = req.session.userId;
	const visible = api.carpools.visibleToUser(carpoolId, requesterId);
	if (!visible) {
		throw new Error("no access to carpool");
	}

	await api.invitations.create({
		userId: requesterId,
		carpoolId,
		isRequest: true,
	});
});

const assertAcceptRequestInit = T.object({
	userId: T.number(),
});
carpools.post("/:id/accept_request", async (req) => {
	// The user to accept
	const { userId: requesterId } = assertAcceptRequestInit(req.body);
	// @ts-expect-error
	const accepterId: number = req.session.userId;
	const carpoolId = +req.params.id;
	const isMember = await api.carpools.isModerator(carpoolId, accepterId);
	if (!isMember) {
		throw new Error("not a moderator");
	}

	// Execute the invitation for the requesterId in the given carpool
	await api.invitations.execute({
		userId: requesterId,
		carpoolId,
	});
});

const assertDenyRequestInit = T.object({
	userId: T.number(),
});
carpools.post("/:id/deny_request", async (req) => {
	// @ts-expect-error
	const denierId: number = req.session.userId;
	const carpoolId = +req.params.id;

	const { userId: requesterId } = assertDenyRequestInit(req.body);

	const isModerator = await api.carpools.isModerator(carpoolId, denierId);
	if (!isModerator) {
		throw new Error("not a moderator");
	}

	await api.invitations.delete(requesterId, carpoolId);
});

const assertInviteInit = T.object({
	userId: T.number(),
});
carpools.post("/:id/invite", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const inviterId: number = req.session.userId;
	const isMember = await api.carpools.isModerator(+req.params.id, inviterId);
	if (!isMember) {
		throw new Error("not a moderator");
	}

	const { userId } = assertInviteInit(req.body);
	await api.invitations.create({
		userId,
		carpoolId,
		isRequest: false,
	});
});

carpools.post("/:id/accept_invite", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	await api.invitations.execute({
		userId,
		carpoolId,
	});
});

carpools.post("/:id/deny_invite", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	await api.invitations.delete(userId, carpoolId);
});

// DELETE /:id/invite {userId}
carpools.delete("/:id/invite", async (req) => {
	const { userId } = assertInviteInit(req.body);
	const carpoolId = +req.params.id;

	await api.invitations.delete(userId, carpoolId);
});

carpools.get("/:id/invitations_and_requests", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const isMember = await api.carpools.isModerator(+req.params.id, userId);
	if (!isMember) {
		throw new Error("not a moderator");
	}
	const invitationsAndRequests = await api.carpools.invitationsAndRequests(
		+req.params.id
	);
	return invitationsAndRequests;
});

carpools.delete("/:id", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const isModerator = await api.carpools.isModerator(+req.params.id, userId);
	if (!isModerator) {
		throw new Error("not a moderator");
	}
	await api.carpools.delete_pool(+req.params.id, userId);
});

const assertCarpoolInit = T.object({
	eventId: T.number(),
	name: T.string(),
});
carpools.post("/", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const { eventId, name } = assertCarpoolInit(req.body);
	const { id } = await api.carpools.create({ userId, eventId, name });
	return { id };
});

// Leave a carpool
carpools.post("/:id/leave", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	await api.carpools.leave(carpoolId, userId);
});
