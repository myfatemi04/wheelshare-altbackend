import api from "../api";
import CustomRouter from "../customrouter";
import { getPlaceDetails } from "../googlemaps";
import carpools from "./carpools";
import groups from "./groups";
import users from "./users";

const rtr = new CustomRouter();

rtr.use("/groups/", groups.expressRouter);
rtr.use("/carpools/", carpools.expressRouter);
rtr.use("/users", users.expressRouter);

rtr.get("/place/:id", (req) => getPlaceDetails(req.params.id));

rtr.get(
	"/resolve_code/:code",
	async (req) => await api.groups.forCode(req.params.code)
);

export default rtr;
