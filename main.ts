import { PrismaClient } from "@prisma/client";
import express, { NextFunction, Request, Router, Response } from "express";
import SessionManager, { Session } from "./sessions";
import { T } from "./validate";
import cors from "cors";
import { json } from "body-parser";

const prisma = new PrismaClient();

function getGroups() {
  return prisma.group.findMany();
}

function getGroupsByUser(userId: number) {
  return prisma.group.findMany({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
  });
}

function getEvents() {
  return prisma.event.findMany({
    orderBy: {
      endTime: "desc",
    },
  });
}

function createEvent(name: string, endTime: Date, groupId: number) {
  return prisma.event.create({
    select: {
      id: true,
    },
    data: {
      name,
      endTime,
      groupId,
    },
  });
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  const dummySession: Session = {
    userId: 0,
  };

  // @ts-expect-error
  req.session = dummySession;

  next();

  const auth = req.headers.authorization;
  const BEARER = "Bearer ";
  if (typeof auth === "string" && auth.startsWith(BEARER)) {
    const token = auth.slice(BEARER.length);
    const session = SessionManager.getSession(token);
    if (session) {
      // @ts-expect-error
      req.session = session;
      next();
    }
  }
}

const api = Router();
api.get("/users/@me/groups", async (req, res) => {
  // @ts-expect-error
  const userID: number = req.session.userId;
  const groups = await getGroupsByUser(userID);
  res.json(groups);
});

api.get("/events", async (req, res) => {
  const events = await getEvents();
  res.json(events);
});

const assertEvent = T.objectWithKeys({
  name: T.string(),
  endTime: T.date(),
  groupId: T.optional(T.number()),
});

api.post("/events", async (req, res) => {
  const { name, endTime, groupId } = assertEvent(req.query);
  const { id } = await createEvent(name, endTime, groupId);
  res.json({
    id,
  });
});

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(json());
app.use("/api", authenticate, api);

async function main() {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Running on [:${PORT}]`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
