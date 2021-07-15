import { createJoinCode } from "../joincode";
import { detailedEventsQuerySelector } from "../selectors";
import prisma from "./prisma";

export type GroupPreview = {
	id: number;
	name: string;
};

export async function one(id: number) {
	return await prisma.group.findFirst({
		include: {
			users: {
				select: {
					id: true,
					name: true,
				},
			},
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

export async function all() {
	return await prisma.group.findMany();
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
	return await prisma.group.findFirst({
		select: {
			events: detailedEventsQuerySelector,
		},
		where: {
			id,
		},
	});
}

export async function create({
	name,
	initialMemberIds,
}: {
	name: string;
	initialMemberIds: number[];
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
		},
	});
}

export async function generateAndApplyJoinCode(id: number) {
	const code = createJoinCode();
	await prisma.group.update({
		select: {},
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
