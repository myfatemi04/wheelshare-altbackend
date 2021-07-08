import { PrismaClient } from "@prisma/client";
import { json } from "body-parser";
import cors from "cors";
import express from "express";
import authenticate, { session } from "./authenticate";
import { getUserIdFromIonCode as getUserIdFromIonCode } from "./auth_ion";
import "./env";
import rtr from "./routes";
import sessions from "./sessions";
import { T } from "./validate";

const prisma = new PrismaClient();

const app = express();
app.use(cors({ origin: "*" }));
app.use(json());
app.use(session);
app.use((req, res, next) => {
	// @ts-expect-error
	console.log(req.method.toUpperCase(), req.path, "--> session:", req.session);

	next();
});
app.use("/api", authenticate, rtr.expressRouter);

const assertSessionInit = T.object({
	code: T.string(),
	redirectUrl: T.string(),
});
app.post("/create_session", async (req, res) => {
	const { code, redirectUrl } = assertSessionInit(req.body);
	try {
		const userId = await getUserIdFromIonCode(code, redirectUrl);
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

try {
	const PORT = process.env.PORT ?? 5000;
	app.listen(PORT, () => {
		console.log(`Running on [:${PORT}]`);
	});
} catch (e) {
	console.error(e);
}

prisma.$disconnect();
