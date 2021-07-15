import { AssertionError } from "assert";
import api from "../api";
import { EventInit } from "../api/events";
import CustomRouter from "../customrouter";
import { NotFound, Unauthorized } from "../errors";
import { T } from "../validate";

const events = new CustomRouter();

export default events;

events.get("/", api.events.all);

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
events.post("/", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const event = assertEventInit(req.body);
	const canCreateEvent = await api.users.canCreateEvent(event.groupId, userId);
	if (!canCreateEvent) {
		throw new Unauthorized();
	}

	await api.events.create(event);
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
});
events.post("/:id/signup", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const eventId = +req.params.id;
	if (!isFinite(eventId)) {
		throw new AssertionError({ message: "id is not number" });
	}

	const can = await api.users.canModifyEvent(eventId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const { placeId } = assertEventSignupInit(req.body);
	await api.signups.update({
		eventId,
		userId,
		placeId,
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
