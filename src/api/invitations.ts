import { InvalidStateTransition } from "../errors";
import prisma from "./prisma";

export async function create({
	userId,
	carpoolId,
	isRequest,
}: {
	userId: number;
	carpoolId: number;
	isRequest: boolean;
}) {
	const existing = await prisma.invitation.findFirst({
		where: {
			userId,
			carpoolId,
		},
	});
	if (existing) {
		if (existing.isRequest) {
			// Do nothing
		} else {
			// They were already invited, and then they requested to join
			execute({ userId, carpoolId });
		}
	} else {
		return await prisma.invitation.create({
			data: {
				userId,
				carpoolId,
				sentTime: new Date(),
				isRequest,
			},
		});
	}
}

async function delete_(userId: number, carpoolId: number) {
	return await prisma.invitation.delete({
		where: {
			userId_carpoolId: {
				userId,
				carpoolId,
			},
		},
	});
}

export { delete_ as delete };

export async function execute({
	userId,
	carpoolId,
}: {
	userId: number;
	carpoolId: number;
}) {
	const existing = await prisma.invitation.findFirst({
		where: { userId, carpoolId },
	});
	if (!existing) {
		throw new InvalidStateTransition();
	}
	await prisma.invitation.delete({
		where: {
			userId_carpoolId: {
				userId,
				carpoolId,
			},
		},
	});
	return await prisma.carpool.update({
		where: {
			id: carpoolId,
		},
		data: {
			members: {
				connect: {
					id: userId,
				},
			},
		},
	});
}
