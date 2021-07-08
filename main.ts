import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { AssertionError } from "assert";
import { json } from "body-parser";
import cors from "cors";
import express from "express";
import api from "./api";
import { EventInit, signups } from "./api/events";
import authenticate, { session } from "./authenticate";
import { getUserIdFromIonCode as getUserIdFromIonCode } from "./auth_ion";
import CustomRouter from "./customrouter";
import { getPlaceDetails } from "./googlemaps";
import sessions from "./sessions";
import { T } from "./validate";

const requiredEnvironmentVariables = [
	"GOOGLE_API_KEY",
	"ION_CLIENT_ID",
	"ION_CLIENT_SECRET",
];

for (let env of requiredEnvironmentVariables) {
	if (!(env in process.env)) {
		console.error(`FATAL: Required environment variable ${env} was not found`);
		process.exit(1);
	}
}

const prisma = new PrismaClient();

const rtr = new CustomRouter();

rtr.get("/users/@me/groups", (req) =>
	api.users.groups(
		// @ts-expect-error
		req.session.userId
	)
);

rtr.get("/events", api.events.all);

rtr.get("/place/:id", (req) => getPlaceDetails(req.params.id));

rtr.get("/events/:id/signups", async (req) => {
	const id = +req.params.id;
	if (!isFinite(id)) {
		throw new AssertionError({ message: "id is not number" });
	}

	return await signups(id);
});

const assertEventSignupInit = T.object({
	placeId: T.nullable(T.string()),
});

rtr.post("/events/:id/signup", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const id = +req.params.id;
	if (!isFinite(id)) {
		throw new AssertionError({ message: "id is not number" });
	}

	const { placeId } = assertEventSignupInit(req.body);
	await api.signups.update({
		eventId: id,
		userId,
		placeId,
	});
});

rtr.delete("/events/:id/signup", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const id = +req.params.id;

	await api.signups.delete(id, userId);
});

const assertEventInit: (v: any) => EventInit = T.object({
	name: T.string(),
	startTime: T.date(),
	duration: T.number(),
	placeId: T.string(),
	groupId: T.optional(T.number()),
	endDate: T.anyOf([T.date(), T.exact<null>(null)]),
	daysOfWeek: (d) => {
		if (typeof d === "number" && isFinite(d)) {
			if (Number.isInteger(d) && d <= 0b0111_1111 && d >= 0b0000_0000) {
				return d;
			}
		}
		throw new AssertionError({ message: "expected 0b0XXX_XXXX" });
	},
});

const assertGroupInit = T.object({
	name: T.string(),
});

rtr.get(
	"/resolve_code/:code",
	async (req) => await api.groups.forCode(req.params.code)
);

const assertGroupJoinInit = T.object({
	code: T.string(),
});
rtr.post("/groups/:id/join", async (req) => {
	const { code } = assertGroupJoinInit(req.body);
	const groupId = +req.params.id;
	// @ts-expect-error
	const userId: number = req.session.userId;
	const correctCode = await api.groups.getCode(groupId);
	if (correctCode == null) {
		throw new Error("this group cannot be joined via a join code");
	}
	if (correctCode !== code) {
		throw new Error("incorrect code");
	}
	await api.groups.addUser(groupId, userId);
});

rtr.get("/groups/:id", async (req) => {
	const id = +req.params.id;
	if (isNaN(id)) {
		return null;
	}

	try {
		return await api.groups.one(id);
	} catch (e) {
		console.error(e);
		return null;
	}
});

rtr.delete("/groups/:id", async (req) => {
	const id = +req.params.id;
	if (isNaN(id)) {
		return null;
	}

	await api.groups.deleteOne(id);
});

rtr.get("/groups/:id/events", async (req) => {
	const id = +req.params.id;
	if (isNaN(id)) {
		return null;
	}

	return (await api.groups.events(id))?.events ?? null;
});

rtr.get("/groups", () => api.groups.all());
rtr.post("/groups", (req) => api.groups.create(assertGroupInit(req.body)));
rtr.post("/events", (req) => api.events.create(assertEventInit(req.body)));

rtr.get("/users/@me", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	if (!isFinite(userId)) {
		return null;
	}
	const user = await prisma.user.findFirst({ where: { id: userId } });
	return user;
});

rtr.get("/carpools/:id", async (req) => {
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
			members: true,
			event: true,
		},
		where: {
			id: carpoolId,
		},
	});
});

rtr.post("/carpools/:id/request", async (req) => {
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
rtr.post("/carpools/:id/accept_request", async (req) => {
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
rtr.post("/carpools/:id/deny_request", async (req) => {
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
rtr.post("/carpools/:id/invite", async (req) => {
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

rtr.post("/carpools/:id/accept_invite", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	await api.invitations.execute({
		userId,
		carpoolId,
	});
});

rtr.post("/carpools/:id/deny_invite", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;
	const carpoolId = +req.params.id;

	await api.invitations.delete(userId, carpoolId);
});

rtr.get("/carpools/:id/invitations_and_requests", async (req) => {
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

rtr.get("/users/@me/received_requests_and_invites", async (req) => {
	// @ts-expect-error
	const userId: number = req.session.userId;

	const requests = await api.users.receivedRequests(userId);
	const invites = await api.users.receivedInvitations(userId);

	return [...requests, ...invites];
});

const app = express();
app.use(
	cors({
		origin: "*",
	})
);
app.use(json());
app.use(session);
app.use((req, res, next) => {
	// @ts-expect-error
	console.log(req.method.toUpperCase(), req.path, "--> session:", req.session);

	next();
});
app.use("/api", authenticate, rtr.expressRouter);

const assertSessionInit = T.object({
	code: T.string(),
	redirectUrl: T.string(),
});

app.post("/create_session", async (req, res) => {
	const { code, redirectUrl } = assertSessionInit(req.body);
	try {
		const userId = await getUserIdFromIonCode(code, redirectUrl);
		const sessionId = sessions.createSession(userId);

		res.json({
			status: "success",
			token: sessionId,
		});
	} catch (e) {
		res.status(500);
		res.json({
			status: "error",
		});
		console.error("/create_session:", e);
	}
});

async function main() {
	const PORT = process.env.PORT ?? 5000;
	app.listen(PORT, () => {
		console.log(`Running on [:${PORT}]`);
	});
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
