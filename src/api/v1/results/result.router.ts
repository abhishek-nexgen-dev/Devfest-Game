import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorizeRoles } from "../../../middleware/role.middleware";
import { ResultConstants } from "./result.constants";
import { ResultValidator } from "./result.validator";
import { ResultController } from "./result.controller";

/**
 * GDG Ranchi DevFest 2026 - Result Router
 */
export class ResultRouter {
  private readonly router: Router;
  private readonly controller: ResultController;

  constructor(controller: ResultController = new ResultController()) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get(ResultConstants.ROUTES.GAME_RESULTS, this.controller.GET_GAME_RESULTS);
    this.router.get(
      "/logs",
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      this.controller.GET_SCORE_LOGS,
    );
    this.router.patch(
      ResultConstants.ROUTES.ROOT,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      ResultValidator.VALIDATE_UPDATE_SCORE,
      this.controller.UPDATE_SCORE,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const resultRouter = new ResultRouter().getRouter();
export default resultRouter;
