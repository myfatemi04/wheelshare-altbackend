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

users.get("/@me/groups", (req) =>
	api.users.groups(
		// @ts-expect-error
		req.session.userId
	)
);

users.get("/@me/received_requests_and_invites", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;

	const requests = await api.users.receivedRequests(userId);
	const invites = await api.users.receivedInvitations(userId);

	return [...requests, ...invites];
});
