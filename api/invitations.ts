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
    throw new Error("Cannot execute invite/request that does not exist");
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
