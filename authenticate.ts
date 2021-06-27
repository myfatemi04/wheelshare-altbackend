import { NextFunction, Request, Response } from "express";
import SessionManager, { Session } from "./sessions";

export default function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
