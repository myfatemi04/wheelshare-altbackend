import { PrismaClient } from "@prisma/client";
import express, { NextFunction, Request, Router, Response } from "express";
import SessionManager, { Session } from "./sessions";
import { T } from "./validate";
import cors from "cors";
import { json } from "body-parser";
import { AssertionError } from "assert";

const prisma = new PrismaClient();

function getGroup(id: number) {
  return prisma.group.findFirst({
    where: {
      id,
    },
  });
}

async function deleteGroup(id: number) {
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

function getGroupEvents(id: number) {
  return prisma.group.findFirst({
    select: {
      events: true,
    },
    where: {
      id,
    },
  });
}

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

function createGroup(name: string) {
  return prisma.group.create({
    select: {
      id: true,
    },
    data: {
      name,
    },
  });
}

function createEvent(
  name: string,
  startTime: Date,
  endTime: Date,
  groupId: number,
  placeId: string
) {
  return prisma.event.create({
    select: {
      id: true,
    },
    data: {
      name,
      startTime,
      endTime,
      group: {
        connect: {
          id: groupId,
        },
      },
      placeId,
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
  startTime: T.date(),
  endTime: T.date(),
  placeId: T.string(),
  groupId: T.optional(T.number()),
});

const assertGroupInit = T.objectWithKeys({
  name: T.string(),
});

api.get("/groups/:id", (req, res) => {
  const id = +req.params.id;
  if (isNaN(id)) {
    res.json(null);
    return;
  }

  getGroup(id)
    .then((group) => {
      res.json(group);
    })
    .catch((error) => {
      console.error(error);
      res.json(null);
    });
});

api.delete("/groups/:id", (req, res) => {
  const id = +req.params.id;
  if (isNaN(id)) {
    res.json(null);
    return;
  }

  deleteGroup(id)
    .then(() => res.json({ status: "success" }))
    .catch((error) => {
      console.error(error);
      res.json({ status: "error" });
    });
});

api.get("/groups/:id/events", (req, res) => {
  const id = +req.params.id;
  if (isNaN(id)) {
    res.json(null);
    return;
  }

  getGroupEvents(id).then((result) => {
    if (!result) {
      res.json(null);
      return;
    }
    res.json(result.events);
  });
});

api.get("/groups", (req, res) => {
  getGroups().then((groups) => {
    res.json(groups);
  });
});

api.post("/groups", (req, res) => {
  const { name } = assertGroupInit(req.body);
  createGroup(name).then(({ id }) => {
    res.json({
      id,
    });
  });
});

api.post("/events", (req, res) => {
  const { name, startTime, endTime, placeId, groupId } = assertEvent(req.body);
  console.log({ name, startTime, endTime, placeId, groupId });
  createEvent(name, startTime, endTime, groupId, placeId).then(({ id }) => {
    res.json({
      id,
    });
  });
});

api.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AssertionError) {
    res.status(400);
    res.json({
      error: err.message,
    });
  } else {
    res.status(500);
    res.json({
      error: "server error",
    });
    console.error(err);
  }
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
