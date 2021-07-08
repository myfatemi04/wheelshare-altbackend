import { AssertionError } from "assert";
import api from "../api";
import { EventInit } from "../api/events";
import CustomRouter from "../customrouter";
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
events.post("/", (req) => api.events.create(assertEventInit(req.body)));

events.get("/:id/signups", async (req) => {
	const id = +req.params.id;
	if (!isFinite(id)) {
		throw new AssertionError({ message: "id is not number" });
	}

	return await api.events.signups(id);
});

const assertEventSignupInit = T.object({
	placeId: T.nullable(T.string()),
});
events.post("/:id/signup", async (req) => {
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

events.delete("/:id/signup", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const id = +req.params.id;

	await api.signups.delete(id, userId);
});
