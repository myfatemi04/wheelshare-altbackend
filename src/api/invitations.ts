import {
	sendInvitedToCarpoolEmail,
	sendRequestAcceptedEmail,
	sendRequestedToJoinCarpoolEmail,
} from "../email";
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
		if (existing.isRequest !== isRequest) {
			execute({ userId, carpoolId });
		}
	} else {
		if (isRequest) {
			const { creatorId } = await prisma.carpool.findFirst({
				select: { creatorId: true },
				where: {
					id: carpoolId,
				},
			});
			sendRequestedToJoinCarpoolEmail(userId, creatorId, carpoolId);
		} else {
			sendInvitedToCarpoolEmail(userId, carpoolId);
		}
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
	if (existing.isRequest) {
		sendRequestAcceptedEmail(userId, carpoolId);
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
