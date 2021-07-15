import api from "../api";
import prisma from "../api/prisma";
import CustomRouter from "../customrouter";

const users = new CustomRouter();

export default users;

users.get("/@me", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	if (!isFinite(userId)) {
		return null;
	}
	const user = await prisma.user.findFirst({ where: { id: userId } });
	return user;
});

users.get("/@me/active_events", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const events = await api.users.activeEvents(userId);
	return events;
});

users.get("/@me/active_carpools", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpools = await api.users.activeCarpools(userId);
	return carpools;
});

users.get("/@me/groups", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const groups = await api.users.groups(userId);
	return groups;
});

users.get("/@me/received_requests_and_invites", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;

	const requests = await api.users.requestsToUser(userId);
	const invites = await api.users.invitationsToUser(userId);

	return [...requests, ...invites];
});

users.get("/@me/sent_requests_and_invites", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;

	const requests = await api.users.requestsFromUser(userId);
	const invites = await api.users.invitationsFromUser(userId);

	return [...requests, ...invites];
});
