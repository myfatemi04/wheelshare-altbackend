import prisma from './prisma';

export async function send(userId: number, carpoolId: number, content: string) {
  return await prisma.message.create({
    select: {
      id: true
    },
    data: {
      content,
      carpoolId,
      userId,
      sentTime: new Date()
    }
  })
}

export async function remove(id: number) {
  return await prisma.message.update({
    data: {
      removed: true
    },
    where: {
      id
    }
  })
}

export async function getMessage(id: number) {
  return await prisma.message.findFirst({
    select: {
      id: true,
      content: true,
      carpoolId: true,
      userId: true,
      removed: true,
      sentTime: true,
    },
    where: {
      id
    }
  });
}