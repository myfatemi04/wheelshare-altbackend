import prisma from "./prisma";

export type InvitationInit = {
    userId: number;
    carpoolId: number;
    isRequest: boolean;
    sentTime: Date;
}

export async function create({
    userId,
    carpoolId,
    isRequest,
    sentTime
}: InvitationInit) {
    
    return await prisma.invitation.create({

    })
}

export async function invitations(id: number) {
    const invitations = prisma.invitation.findMany({
        select: {
            userId: true,
            carpoolId: true,
            isRequest: true,
            sentTime: true
        },
        where: {
          carpoolId: id,
          userId: id
        }
    });
    return invitations;
}