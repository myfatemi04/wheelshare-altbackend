import prisma from "./prisma";
import { createJoinCode } from "../joincode";
import api from ".";

export async function one(id: number) {
	return await prisma.group.findFirst({
		where: {
			id,
		},
	});
}

export type GroupPreview = {
	id: number;
	name: string;
};

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
			events: {
				select: {
					id: true,
					name: true,
					groupId: true,
					group: true,
					startTime: true,
					duration: true,
					endTime: true,
					daysOfWeek: true,
					placeId: true,
					formattedAddress: true,
					latitude: true,
					longitude: true,
					signups: true,
					carpools: {
					  select: {
						id: true,
						name: true,
						members: {
						  select: {
							id: true,
							name: true
						  }
						}
					  }
					}
				}
			}
		},
		where: {
			id,
		},
	});

//	const toRet = {events: []};
//	for(let i = 0; i < data.events.length; i++) {
//		toRet.events[i] = {
//			event: data.events[i],
//			alreadyInCarpool: api.events.alreadyInCarpool(id, userId)
//		};
//	}
//	return toRet;
}

export async function create({ name }: { name: string }) {
	return await prisma.group.create({
		select: {
			id: true,
		},
		data: {
			name,
		},
	});
}

export async function joinCode(id: number) {
	return await prisma.group.update({
		where: {
			id,
		},
		data: {
			joinCode: createJoinCode(),
		},
	});
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
			id
		},
		data: {
			name: newName
		}
	});
}