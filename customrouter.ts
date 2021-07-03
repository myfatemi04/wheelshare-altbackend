import { AssertionError } from "assert";
import { Request, RequestHandler, Router } from "express";
import { RouteParameters } from "express-serve-static-core";

export default class CustomRouter {
  constructor(public readonly expressRouter: Router = Router()) {}
  private createCallback<T, P>(cb: (req: Request<P>) => T | Promise<T>) {
    const newCallback: RequestHandler = async (req, res) => {
      try {
        let result = cb(
          // @ts-ignore
          req
        );
        if (typeof result === "undefined") {
          res.json({ status: "success" });
        } else if (result instanceof Promise) {
          res.json(await result);
        } else {
          res.json(result);
        }
      } catch (e) {
        if (e instanceof AssertionError) {
          res.status(400);
          res.json({ status: "error", message: e.message });
        } else {
          console.error("Unexpected server error");
          console.error(e);
          res.status(500);
          res.json({ status: "error" });
        }
      }
    };
    return newCallback;
  }
  get<T, Route extends string>(
    path: Route,
    callback: (req: Request<RouteParameters<Route>>) => T | Promise<T>
  ) {
    this.expressRouter.get(path, this.createCallback(callback));
  }
  post<T, Route extends string>(
    path: Route,
    callback: (req: Request<RouteParameters<Route>>) => T | Promise<T>
  ) {
    this.expressRouter.post(path, this.createCallback(callback));
  }
  delete<T, Route extends string>(
    path: Route,
    callback: (req: Request<RouteParameters<Route>>) => T | Promise<T>
  ) {
    this.expressRouter.delete(path, this.createCallback(callback));
  }
}
