import { AssertionError } from "assert";
import api from "../api";
import { EventInit, EventUpdate } from "../api/events";
import CustomRouter from "../customrouter";
import { NotFound, Unauthorized } from "../errors";
import { T } from "../validate";

const events = new CustomRouter();

export default events;

const assertEventInit: (v: any) => EventInit = T.object({
	name: T.string(),
	startTime: T.date(),
	duration: T.number(),
	placeId: T.string(),
	groupId: T.optional(T.number()),
	endDate: T.anyOf([T.date(), T.exact<null>(null)]),
	description: T.optional(T.string()),
	daysOfWeek: (d) => {
		if (typeof d === "number" && isFinite(d)) {
			if (Number.isInteger(d) && d <= 0b0111_1111 && d >= 0b0000_0000) {
				return d;
			}
		}
		throw new AssertionError({ message: "expected 0b0XXX_XXXX" });
	},
});
events.post("/", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const event = assertEventInit(req.body);
	const can = await api.users.canCreateEventInGroup(event.groupId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	await api.events.create(event, userId);
});

events.delete("/:id", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const eventId = +req.params.id;
	const can = await api.users.canDeleteEvent(eventId, userId);
	if (!can) {
		throw new Unauthorized();
	}
	await api.events.delete(eventId);
});

const assertEventUpdate: (v: any) => EventUpdate = T.object({
	name: T.optional(T.string()),
	startTime: T.optional(T.date()),
	duration: T.optional(T.number()),
	placeId: T.optional(T.string()),
	endDate: T.optional(T.anyOf([T.date(), T.exact<null>(null)])),
	description: T.optional(T.string()),
	daysOfWeek: T.optional((d) => {
		if (typeof d === "number" && isFinite(d)) {
			if (Number.isInteger(d) && d <= 0b0111_1111 && d >= 0b0000_0000) {
				return d;
			}
		}
		throw new AssertionError({ message: "expected 0b0XXX_XXXX" });
	}),
});
events.post("/:id/update", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const eventId = +req.params.id;
	if (isNaN(eventId)) {
		throw new NotFound();
	}
	const eventUpdate = assertEventUpdate(req.body);
	await api.events.update(eventId, eventUpdate);
	return await api.events.get(eventId);
});

events.post("/:id/cancel", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const eventId = +req.params.id;

	const canModifyEvent = await api.users.canModifyEvent(eventId, userId);
	if (!canModifyEvent) {
		throw new Unauthorized();
	}

	await api.events.cancel(eventId);
});

events.get("/:id/signups", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const eventId = +req.params.id;
	if (!isFinite(eventId)) {
		throw new AssertionError({ message: "id is not number" });
	}

	const canViewEvent = await api.users.canViewEvent(eventId, userId);
	if (!canViewEvent) {
		throw new Unauthorized();
	}

	return await api.events.signups(eventId);
});

const assertEventSignupInit = T.object({
	placeId: T.nullable(T.string()),
	canDrive: T.boolean(),
	note: T.optional(T.string()),
});
events.post("/:id/signup", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const eventId = +req.params.id;
	if (!isFinite(eventId)) {
		throw new AssertionError({ message: "id is not number" });
	}

	const can = await api.users.canSignUpForEvent(eventId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const { placeId, canDrive, note } = assertEventSignupInit(req.body);
	await api.signups.update({
		eventId,
		userId,
		placeId,
		canDrive,
		note,
	});
});

events.delete("/:id/signup", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const eventId = +req.params.id;

	await api.signups.delete(eventId, userId);
});

events.get("/:id", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const eventId = +req.params.id;

	const canViewEvent = await api.users.canViewEvent(eventId, userId);
	if (!canViewEvent) {
		throw new Unauthorized();
	}

	const event = await api.events.get(eventId);
	if (!event) {
		throw new NotFound();
	}

	return event;
});

events.get("/:id/signups_bulk", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const eventId = +req.params.id;

	const can = await api.users.canViewEvent(eventId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const userIdsQs = req.query.userIds;
	if (typeof userIdsQs !== "string") {
		throw new AssertionError({ message: "expected string" });
	}

	const userIds = [];
	for (let id of userIdsQs.split(",")) {
		if (isFinite(+id)) {
			userIds.push(+id);
		} else {
			throw new AssertionError({ message: "expected numeric userid" });
		}
	}

	return await api.events.signupsBulk(eventId, userIds);
});
