import { Session } from "./sessions";

declare module "express-serve-static-core" {
  interface Request {
    session: Session;
  }
}
