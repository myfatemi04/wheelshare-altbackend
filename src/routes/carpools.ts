import api from "../api";
import prisma from "../api/prisma";
import CustomRouter from "../customrouter";
import { NotFound, Unauthorized } from "../errors";
import { T } from "../validate";

const carpools = new CustomRouter();

export default carpools;

carpools.get("/:id", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const requesterId: number = req.session.userId;
	const can = await api.users.canViewCarpool(carpoolId, requesterId);
	if (!can) {
		throw new Unauthorized();
	}
	if (isNaN(carpoolId)) {
		throw new NotFound();
	}

	const carpool = await api.carpools.get(carpoolId);
	if (!carpool) {
		throw new NotFound();
	}

	return carpool;
});

carpools.delete("/:id/request", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const userId: number = req.session.userId;

	const can = await api.users.canManageCarpoolRequests(carpoolId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	await api.invitations.delete(userId, carpoolId);
});

carpools.post("/:id/request", async (req) => {
	const carpoolId = +req.params.id;
	// @ts-expect-error
	const requesterId: number = req.session.userId;
	const can = await api.users.canViewCarpool(carpoolId, requesterId);
	if (!can) {
		throw new Unauthorized();
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

	const can = await api.users.canManageCarpoolRequests(carpoolId, accepterId);
	if (!can) {
		throw new Unauthorized();
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

	const can = await api.users.canManageCarpoolRequests(carpoolId, denierId);
	if (!can) {
		throw new Unauthorized();
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
	const can = await api.users.canManageCarpoolInvites(carpoolId, inviterId);
	if (!can) {
		throw new Unauthorized();
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

	// No permissions needed to accept an invitation

	await api.invitations.execute({
		userId,
		carpoolId,
	});
});

carpools.post("/:id/deny_invite", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	// No permissions needed to deny an invitation

	await api.invitations.delete(userId, carpoolId);
});

// DELETE /:id/invite {userId}
carpools.delete("/:id/invite", async (req) => {
	const { userId } = assertInviteInit(req.body);
	const carpoolId = +req.params.id;

	// @ts-expect-error
	const managerId = +req.session.userId;

	const can = await api.users.canManageCarpoolInvites(carpoolId, managerId);
	if (!can) {
		throw new Unauthorized();
	}

	await api.invitations.delete(userId, carpoolId);
});

carpools.get("/:id/invitations_and_requests", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;
	const can = await api.users.canViewCarpoolInvitesAndRequests(
		carpoolId,
		userId
	);
	if (!can) {
		throw new Unauthorized();
	}
	const invitationsAndRequests = await api.carpools.invitationsAndRequests(
		+req.params.id
	);
	return invitationsAndRequests;
});

carpools.delete("/:id", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;
	const can = await api.users.canDeleteCarpool(carpoolId, userId);
	if (!can) {
		throw new Unauthorized();
	}
	await api.carpools.delete(+req.params.id);
});

const assertCarpoolInit = T.object({
	eventId: T.number(),
	name: T.string(),
	invitedUserIds: T.optional(T.array(T.number())),
});
carpools.post("/", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const { eventId, name, invitedUserIds } = assertCarpoolInit(req.body);

	const can = await api.users.canAddCarpoolToEvent(eventId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const { id } = await api.carpools.create({
		userId,
		eventId,
		name,
		invitedUserIds,
	});

	return { id };
});

// Leave a carpool
carpools.post("/:id/leave", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	// No permissions required to leave a carpool

	await api.carpools.leave(carpoolId, userId);
});

carpools.get("/:id/potential_invitees", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	const can = await api.users.canManageCarpoolInvites(carpoolId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	return await api.carpools.potentialInvitees(carpoolId);
});
