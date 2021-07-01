import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { AssertionError } from "assert";
import { json } from "body-parser";
import cors from "cors";
import express from "express";
import api from "./api";
import authenticate from "./authenticate";
import CustomRouter from "./customrouter";
import { getPlaceDetails } from "./googlemaps";
import { T } from "./validate";

const { AuthorizationCode } = require('simple-oauth2');
const session = require('cookie-session');

const prisma = new PrismaClient();

const rtr = new CustomRouter();

const ion_client_id = 'ojfWWAyRyfTpNB4tNUKjcYTVytpi7moNt21M857O';
const ion_redirect_uri = 'http://localhost/';
const client = new AuthorizationCode({
    client: {
        id: ion_client_id,
        secret: process.env.ION_CLIENT_SECRET
    },
    auth: {
        tokenHost: 'https://ion.tjhsst.edu/oauth/',
        authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
        tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
    }
});

const authorizationUri = client.authorizeURL({
  scope: 'read',
  redirect_uri: ion_redirect_uri
});

rtr.get("/users/@me/groups", (req) =>
  api.users.getGroups(
    // @ts-expect-error
    req.session.userId
  )
);

rtr.get("/events", api.events.getAll);

rtr.get("/place/:id", (req) => getPlaceDetails(req.params.id));

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

const assertEventInit = T.object({
  name: T.string(),
  startTime: T.date(),
  endTime: T.date(),
  placeId: T.string(),
  groupId: T.optional(T.number()),
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

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(json());
app.use("/api", authenticate, rtr.expressRouter);
app.set('trust proxy', 1);
app.use(express.static('static'));
app.use(session({
  name: 'cookies',
  keys: ['mysecret']
}));

async function handleCode(req, res, next) {
  var code = req.query.code;

  var options = {
      code: code,
      redirect_uri: ion_redirect_uri,
      scope: 'read'
  };

  try {
      var accessToken = await client.getToken(options);
      console.log(accessToken);
      res.locals.token = accessToken.token;
      next();
  }
  catch(error) {
      console.log('Access Token Error: ', error.message);
      res.send(502);
  }
};

app.get('/oauth_verified', handleCode, function(req, res) {
  // @ts-ignore
  req.session.authenticated = true;
  // @ts-ignore
  req.session.token = res.locals.token;
  // @ts-ignore
  res.redirect('./');
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
