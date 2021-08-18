import { AssertionError } from "assert";
import api from "../api";
import CustomRouter from "../customrouter";
import { sendErrorReportEmail } from "../email";
import { getPlaceDetails } from "../googlemaps";
import carpools from "./carpools";
import events from "./events";
import groups from "./groups";
import users from "./users";

const rtr = new CustomRouter();

rtr.use("/groups/", groups.expressRouter);
rtr.use("/carpools/", carpools.expressRouter);
rtr.use("/users/", users.expressRouter);
rtr.use("/events/", events.expressRouter);
rtr.post("/user_reported_error", async (req) => {
	if (typeof req.body.error !== "string") {
		throw new AssertionError({ message: "expected string for error text" });
	}

	// @ts-expect-error
	const userId = +req.session.userId;

	console.log("Received error report from", userId, "-", req.body.error);

	await sendErrorReportEmail(req.body.error, userId);
});

rtr.get(
	"/resolve_code/:code",
	async (req) => await api.groups.forCode(req.params.code)
);

export default rtr;
