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

rtr.get(
	"/resolve_code/:code",
	async (req) => await api.groups.forCode(req.params.code)
);

export default rtr;
