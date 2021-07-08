import api from "../api";
import CustomRouter from "../customrouter";
import { T } from "../validate";

const groups = new CustomRouter();

groups.get("/", () => api.groups.all());

const assertGroupInit = T.object({
	name: T.string(),
});

groups.post("/", (req) => api.groups.create(assertGroupInit(req.body)));

const assertGroupJoinInit = T.object({
	code: T.string(),
});
groups.post("/:id/join", async (req) => {
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

groups.get("/:id", async (req) => {
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

groups.delete("/:id", async (req) => {
	const id = +req.params.id;
	if (isNaN(id)) {
		return null;
	}

	await api.groups.deleteOne(id);
});

groups.get("/:id/events", async (req) => {
	const id = +req.params.id;
	if (isNaN(id)) {
		return null;
	}

	return (await api.groups.events(id))?.events ?? null;
});

groups.post("/:id/generate_code", async (req) => {
	// add group membership verification
	const groupId: number = +req.params.id;
	await api.groups.joinCode(groupId);
});

groups.post("/:id/reset_code", async (req) => {
	// add group membership verification
	const groupId: number = +req.params.id;
	await api.groups.resetCode(groupId);
});

export default groups;
