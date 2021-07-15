import { NextFunction, Request, Response } from "express";
import { Unauthenticated } from "./errors";
import SessionManager from "./sessions";

export function session(req: Request, res: Response, next: NextFunction) {
	const auth = req.headers.authorization;
	const BEARER = "Bearer ";
	if (typeof auth === "string" && auth.startsWith(BEARER)) {
		const token = auth.slice(BEARER.length);
		const session = SessionManager.getSession(token);
		// @ts-expect-error
		req.session = session;
	} else {
		// @ts-expect-error
		req.session = null;
	}
	next();
}

export default function authenticate(
	req: Request,
	res: Response,
	next: NextFunction
) {
	// @ts-expect-error
	if (req.session) {
		next();
	} else {
		throw new Unauthenticated();
	}
}
