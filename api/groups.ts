import prisma from "./prisma";

export async function one(id: number) {
  return await prisma.group.findFirst({
    where: {
      id,
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
      events: true,
    },
    where: {
      id,
    },
  });
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
