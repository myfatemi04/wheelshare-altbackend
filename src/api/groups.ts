import { InvalidStateTransition } from "../errors";
import { createJoinCode } from "../joincode";
import {
	detailedEventsQuerySelector,
	userPreviewQuerySelector,
} from "../selectors";
import prisma from "./prisma";
import { isGroupMember } from "./users";

export type GroupPreview = {
	id: number;
	name: string;
};

export async function one(id: number) {
	return await prisma.group.findFirst({
		select: {
			id: true,
			name: true,
			joinCode: true,
			users: userPreviewQuerySelector,
			admins: userPreviewQuerySelector,
			events: detailedEventsQuerySelector,
		},
		where: {
			id,
		},
	});
}

export async function forCode(code: string): Promise<GroupPreview | null> {
	return await prisma.group.findFirst({
		select: {
			id: true,
			name: true,
		},
		where: {
			joinCode: code,
		},
	});
}

export async function getCode(groupId: number): Promise<string> {
	const { joinCode } = await prisma.group.findFirst({
		where: { id: groupId },
	});

	return joinCode;
}

export async function addUser(groupId: number, userId: number) {
	return await prisma.group.update({
		where: {
			id: groupId,
		},
		data: {
			users: {
				connect: {
					id: userId,
				},
			},
		},
	});
}

export async function removeUser(groupId: number, userId: number) {
	return await prisma.group.update({
		where: {
			id: groupId,
		},
		data: {
			users: {
				delete: { id: userId },
			},
		},
	});
}

export async function addAdmin(groupId: number, userId: number) {
	return await prisma.group.update({
		where: {
			id: groupId,
		},
		data: {
			admins: {
				connect: {
					id: userId,
				},
			},
		},
	});
}

export async function removeAdmin(groupId: number, userId: number) {
	const { admins } = await prisma.group.findFirst({
		select: {
			admins: true,
		},
		where: {
			id: groupId,
		},
	});
	if (admins.length === 1 && admins[0].id === userId) {
		// If the admin is the only admin, require them to specify a new admin
		throw new InvalidStateTransition(
			"cannot remove self as admin without having another admin remaining"
		);
	}

	return await prisma.group.update({
		where: {
			id: groupId,
		},
		data: {
			admins: {
				disconnect: {
					id: userId,
				},
			},
		},
	});
}

export async function all() {
	return await prisma.group.findMany();
}

export async function withMember(userId: number) {
	return await prisma.group.findMany({
		where: {
			users: {
				some: {
					id: userId,
				},
			},
		},
	});
}

export async function deleteOne(id: number) {
	await prisma.event.deleteMany({
		where: {
			groupId: id,
		},
	});

	return await prisma.group.delete({
		where: {
			id,
		},
	});
}

export async function events(id: number) {
	const group = await prisma.group.findFirst({
		select: {
			events: detailedEventsQuerySelector,
		},
		where: {
			id,
		},
	});

	if (!group) {
		return null;
	} else {
		return group.events;
	}
}

export async function create({
	name,
	initialMemberIds,
	creatorId,
}: {
	name: string;
	initialMemberIds: number[];
	creatorId: number;
}) {
	return await prisma.group.create({
		select: {
			id: true,
		},
		data: {
			name,
			users: {
				connect: initialMemberIds.map((id) => ({ id })),
			},
			admins: {
				connect: {
					id: creatorId,
				},
			},
		},
	});
}

export async function generateAndApplyJoinCode(id: number) {
	const code = createJoinCode();
	await prisma.group.update({
		select: {
			id: true,
		},
		where: {
			id,
		},
		data: {
			joinCode: code,
		},
	});
	return code;
}

export async function resetCode(id: number) {
	return await prisma.group.update({
		where: {
			id,
		},
		data: {
			joinCode: null,
		},
	});
}

export async function rename(id: number, newName: string) {
	return await prisma.group.update({
		where: {
			id,
		},
		data: {
			name: newName,
		},
	});
}
