import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { AssertionError } from "assert";
import { json } from "body-parser";
import cors from "cors";
import express from "express";
import api from "./api";
import { EventInit, signups } from "./api/events";
import authenticate, { session } from "./authenticate";
import { getUserIdFromIonCode as getUserIdFromIonCode } from "./auth_ion";
import CustomRouter from "./customrouter";
import { getPlaceDetails } from "./googlemaps";
import sessions from "./sessions";
import { T } from "./validate";

const prisma = new PrismaClient();

const rtr = new CustomRouter();

rtr.get("/users/@me/groups", (req) =>
  api.users.groups(
    // @ts-expect-error
    req.session.userId
  )
);

rtr.get("/events", api.events.all);

rtr.get("/place/:id", (req) => getPlaceDetails(req.params.id));

rtr.get("/events/:id/signups", async (req) => {
  const id = +req.params.id;
  if (!isFinite(id)) {
    throw new AssertionError({ message: "id is not number" });
  }

  return await signups(id);
});

const assertEventSignupInit = T.object({
  placeId: T.string(),
});

rtr.post("/events/:id/signup", async (req) => {
  // @ts-expect-error
  const userId = req.session.userId;
  const id = +req.params.id;
  if (!isFinite(id)) {
    throw new AssertionError({ message: "id is not number" });
  }

  const { placeId } = assertEventSignupInit(req.body);
  const details = await getPlaceDetails(placeId);
  if (!details) {
    throw new Error("placeid was invalid");
  }

  const { latitude, longitude, formattedAddress } = details;
  await api.signups.update({
    eventId: id,
    userId,
    latitude,
    longitude,
    formattedAddress,
    placeId,
  });
});

rtr.delete("/events/:id/signup", async (req) => {
  // @ts-expect-error
  const userId = req.session.userId;
  const id = +req.params.id;

  await api.signups.delete(id, userId);
});

const assertEventInit: (v: any) => EventInit = T.object({
  name: T.string(),
  startTime: T.date(),
  duration: T.number(),
  placeId: T.string(),
  groupId: T.optional(T.number()),
  endDate: T.anyOf([T.date(), T.exact<null>(null)]),
  daysOfWeek: (d) => {
    if (typeof d === "number" && isFinite(d)) {
      if (Number.isInteger(d) && d <= 0b0111_1111 && d >= 0b0000_0000) {
        return d;
      }
    }
    throw new AssertionError({ message: "expected 0b0XXX_XXXX" });
  },
});

const assertGroupInit = T.object({
  name: T.string(),
});

rtr.get("/groups/:id", async (req) => {
  const id = +req.params.id;
  if (isNaN(id)) {
    return null;
  }

  try {
    return await api.groups.one(id);
  } catch (e) {
    console.error(e);
    return null;
  }
});

rtr.delete("/groups/:id", async (req) => {
  const id = +req.params.id;
  if (isNaN(id)) {
    return null;
  }

  await api.groups.deleteOne(id);
});

rtr.get("/groups/:id/events", async (req) => {
  const id = +req.params.id;
  if (isNaN(id)) {
    return null;
  }

  return (await api.groups.events(id))?.events ?? null;
});

rtr.get("/groups", () => api.groups.all());
rtr.post("/groups", (req) => api.groups.create(assertGroupInit(req.body)));
rtr.post("/events", (req) => api.events.create(assertEventInit(req.body)));

rtr.post("/send_invite", () => {});
rtr.post("/accept_invite", () => {});
rtr.post("/send_request", () => {});
rtr.post("/accept_request", () => {});

rtr.get("/users/@me", async (req) => {
  // @ts-expect-error
  const userId: number = req.session.userId;
  if (!isFinite(userId)) {
    return null;
  }
  const user = await prisma.user.findFirst({ where: { id: userId } });
  return user;
});

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(json());
app.use(session);
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     saveUninitialized: false,
//     resave: false,
//   })
// );
app.use((req, res, next) => {
  // @ts-expect-error
  console.log(req.path, "--> session:", req.session);

  next();
});
app.use("/api", authenticate, rtr.expressRouter);

const assertSessionInit = T.object({
  code: T.string(),
});

app.post("/create_session", async (req, res) => {
  const { code } = assertSessionInit(req.body);
  try {
    const userId = await getUserIdFromIonCode(code);
    const sessionId = sessions.createSession(userId);

    res.json({
      status: "success",
      token: sessionId,
    });
  } catch (e) {
    res.status(500);
    res.json({
      status: "error",
    });
    console.error("/create_session:", e);
  }
});

async function main() {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Running on [:${PORT}]`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
