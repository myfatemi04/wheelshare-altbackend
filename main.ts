import "dotenv/config";

import { EventSignupType, PrismaClient } from "@prisma/client";
import { AssertionError } from "assert";
import { json } from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response, Router } from "express";
import SessionManager, { Session } from "./sessions";
import { T } from "./validate";
import fetch from "node-fetch";

const prisma = new PrismaClient();

const googleAPIKey = process.env.GOOGLE_API_KEY;
const placeFields = ["formatted_address", "geometry"].join(",");
async function getPlaceDetails(placeId: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleAPIKey}&fields=${placeFields}`
  );
  const json = await response.json();

  console.log(placeId, json);

  if (json.status === "OK") {
    const { result } = json;

    const transformed = {
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };

    return transformed;
  } else if (json.status === "INVALID_REQUEST") {
    return null;
  } else if (json.status === "REQUEST_DENIED") {
    console.error("Google Maps API request was denied.");
    return null;
  }
}

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

async function createEvent(
  name: string,
  startTime: Date,
  endTime: Date,
  groupId: number,
  placeId: string
) {
  const placeDetails = await getPlaceDetails(placeId);
  if (placeDetails == null) {
    throw new Error("invalid placeId");
  }
  const { latitude, longitude, formattedAddress } = placeDetails;
  return await prisma.event.create({
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
      latitude,
      longitude,
      formattedAddress,
    },
  });
}

function updateEventSignup(
  eventId: number,
  userId: number,
  type: EventSignupType
) {
  return prisma.eventSignup.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    update: {
      type: {
        set: type,
      },
    },
    create: {
      eventId,
      userId,
      type,
    },
  });
}

function deleteEventSignup(eventId: number, userId: number) {
  return prisma.eventSignup.delete({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
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

const assertEventSignupInit = T.anyOf([
  T.objectWithKeys({
    type: T.stringValue("GOING_CANDRIVE"),
  }),
  T.objectWithKeys({
    type: T.stringValue("GOING_CANNOTDRIVE"),
  }),
  T.objectWithKeys({
    type: T.stringValue("INTERESTED"),
    pickup: T.optional(
      T.objectWithKeys({
        placeId: T.string(),
      })
    ),
    dropoff: T.optional(
      T.objectWithKeys({
        placeId: T.string(),
      })
    ),
  }),
  T.objectWithKeys({
    type: T.stringValue("NOTGOING"),
  }),
]);

api.post("/events/:id/signup", (req, res) => {
  // @ts-expect-error
  const userId = req.session.userId;
  const id = +req.params.id;
  const signup = assertEventSignupInit(req.body);
  if (isNaN(id)) {
    res.status(400);
    return;
  }
  if (signup.type === "INTERESTED") {
    //
  }
  updateEventSignup(id, userId, signup.type)
    .then(() => {
      res.json({ status: "success" });
    })
    .catch(() => {
      res.status(500);
      res.json({ status: "error" });
    });
});

api.delete("/events/:id/signup", (req, res) => {
  // @ts-expect-error
  const userId = req.session.userId;
  const id = +req.params.id;
  deleteEventSignup(id, userId)
    .then(() => {
      res.json({ status: "success" });
    })
    .catch(() => {
      res.status(500);
      res.json({ status: "error" });
    });
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
