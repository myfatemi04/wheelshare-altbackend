import { Invitation } from "@prisma/client";
import prisma from "./prisma";

export async function invitationsAndRequests(
	carpoolId: number
): Promise<Invitation[]> {
	return await prisma.invitation.findMany({
		where: { carpoolId },
	});
}

export async function isModerator(
	carpoolId: number,
	memberId: number
): Promise<boolean> {
	const count = await prisma.carpool.count({
		where: {
			id: carpoolId,
			members: {
				some: {
					id: memberId,
				},
			},
		},
	});
	return count > 0;
}

/**
 * Returns true if the carpool is in a group that the user is in.
 */
export async function visibleToUser(carpoolId: number, userId: number) {
	await prisma.group.count({
		where: {
			// Where this carpool's event exists
			events: {
				some: {
					carpools: {
						some: {
							id: carpoolId,
						},
					},
				},
			},
			users: {
				some: {
					id: userId,
				},
			},
		},
	});
}

export async function active(id: number) {
	const active = await prisma.carpool.findMany({
		where: {
			members: {
		  		some: {
					id
		  		}
			},
			event: {
				endTime: {
					lt: new Date()
				}
			}
	  	}
	});
	
	return active;
}