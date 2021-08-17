import { PrismaClient } from "@prisma/client";
import { json } from "body-parser";
import cors from "cors";
import express from "express";
import authenticate, { session } from "./authenticate";
import { getUserIDFromGoogleCode } from "./auth_google";
import { getUserIdFromIonCode } from "./auth_ion";
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

const providerAuthenticators = {
	ion: getUserIdFromIonCode,
	google: getUserIDFromGoogleCode,
};
app.post("/auth/:provider", async (req, res) => {
	const { code, redirectUrl } = assertSessionInit(req.body);
	const provider = req.params.provider;
	if (!(provider in providerAuthenticators)) {
		res.json({
			status: "error",
			message: `Unknown provider ${provider}`,
		});
		res.status(400);
		return;
	}
	const getOrCreateUserId = providerAuthenticators[provider];

	try {
		const userId = await getOrCreateUserId(code, redirectUrl);
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
		console.error(`/auth/${provider}:`, e);
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
