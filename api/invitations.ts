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