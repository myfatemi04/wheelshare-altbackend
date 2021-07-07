import { Invitation } from "@prisma/client";
import prisma from "./prisma";

export async function invitationsAndRequests(
  carpoolId: number
): Promise<Invitation[]> {
  return await prisma.invitation.findMany({
    where: { carpoolId },
  });
}

export async function has(
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
