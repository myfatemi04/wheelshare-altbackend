import api from "../api";
import prisma from "../api/prisma";
import { getUserProfileForSelf } from "../api/users";
import CustomRouter from "../customrouter";
import { T } from "../validate";

const users = new CustomRouter();

export default users;

users.get("/@me", async (req) => {
	// @ts-expect-error
	const id = +req.session.userId;
	if (!isFinite(id)) {
		console.warn(
			"Invalid user ID, but made it through API auth: ",
			// @ts-expect-error
			req.session
		);
		throw new Error("???");
	}
	return await getUserProfileForSelf(id);
});

const assertEventQueryInit = T.anyOf<
	| {}
	| {
			lastEndTime: Date;
			lastId: number;
	  }
>([
	T.object({} as const),
	T.object({
		lastEndTime: T.date(),
		lastId: T.number(),
	}),
]);

users.get("/@me/active_events", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const eventQuery = assertEventQueryInit(req.query);

	const last =
		"lastId" in eventQuery
			? { id: eventQuery.lastId, endTime: eventQuery.lastEndTime }
			: null;

	return await api.events.mostRecentForUser(userId, last);
});

users.get("/@me/active_carpools", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const carpools = await api.users.activeCarpools(userId);
	return carpools;
});

users.get("/@me/groups", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const groups = await api.users.groups(userId);
	return groups;
});

users.get("/@me/received_requests_and_invites", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;

	const requests = await api.users.requestsToUser(userId);
	const invites = await api.users.invitationsToUser(userId);

	return [...requests, ...invites];
});

users.get("/@me/sent_requests_and_invites", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;

	const requests = await api.users.requestsFromUser(userId);
	const invites = await api.users.invitationsFromUser(userId);

	return [...requests, ...invites];
});
