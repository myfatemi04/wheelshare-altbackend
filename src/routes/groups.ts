import api from "../api";
import { canViewGroup } from "../api/users";
import CustomRouter from "../customrouter";
import { Forbidden, NotFound, Unauthorized } from "../errors";
import { T } from "../validate";

const groups = new CustomRouter();

groups.get("/", () => api.groups.all());

const assertGroupInit = T.object({
	name: T.string(),
});

groups.post("/", async (req) => {
	const { name } = assertGroupInit(req.body);
	// @ts-expect-error
	const userId = +req.session.userId;

	const { id } = await api.groups.create({
		name,
		initialMemberIds: [userId],
		creatorId: userId,
	});
	return { id };
});

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
		throw new Forbidden();
	}
	if (correctCode !== code) {
		throw new Unauthorized();
	}
	await api.groups.addUser(groupId, userId);
});

groups.get("/:id", async (req) => {
	const groupId = +req.params.id;
	if (isNaN(groupId)) {
		throw new NotFound();
	}

	// @ts-expect-error
	const userId = +req.session.userId;

	const can = await canViewGroup(groupId, userId);
	if (!can) {
		throw new NotFound();
	}

	try {
		const result = await api.groups.one(groupId);
		if (!result) {
			console.warn(
				"The user could view the group, but the group was not found:",
				groupId
			);
			throw new NotFound();
		}
		return result;
	} catch (e) {
		throw new NotFound();
	}
});

groups.delete("/:id", async (req) => {
	const groupId = +req.params.id;
	if (isNaN(groupId)) {
		throw new NotFound();
	}

	// @ts-expect-error
	const userId = +req.session.userId;

	const can = await api.users.canDeleteGroup(groupId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	await api.groups.deleteOne(groupId);
});

groups.get("/:id/events", async (req) => {
	// @ts-expect-error
	const userId = req.session.userId;
	const groupId = +req.params.id;
	if (isNaN(groupId)) {
		throw new NotFound();
	}

	const can = await canViewGroup(groupId, userId);
	if (!can) {
		throw new NotFound();
	}

	return await api.groups.events(groupId);
});

groups.post("/:id/generate_code", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const groupId: number = +req.params.id;

	const can = await api.users.canGenerateJoinCode(groupId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const code: string = await api.groups.generateAndApplyJoinCode(groupId);
	return { code };
});

groups.post("/:id/reset_code", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const groupId: number = +req.params.id;

	const can = await api.users.canResetJoinCode(groupId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	await api.groups.resetCode(groupId);
});

groups.post("/:id/add_admin", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const groupId: number = +req.params.id;
	const can = await api.users.canAddAdmins(groupId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const userIdToAdd: number = +req.body.userId;
	await api.groups.addAdmin(groupId, userIdToAdd);
});

groups.post("/:id/remove_admin", async (req) => {
	// @ts-expect-error
	const userId = +req.session.userId;
	const groupId: number = +req.params.id;
	const can = await api.users.canRemoveAdmins(groupId, userId);
	if (!can) {
		throw new Unauthorized();
	}

	const userIdToRemove: number = +req.body.userId;
	await api.groups.removeAdmin(groupId, userIdToRemove);
});

export default groups;
