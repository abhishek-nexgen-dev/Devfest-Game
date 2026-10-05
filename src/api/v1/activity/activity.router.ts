import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorizeRoles } from "../../../middleware/role.middleware";
import { ActivityConstants } from "./activity.constants";
import { ActivityController } from "./activity.controller";

/**
 * GDG Ranchi DevFest 2026 - Activity Router
 */
export class ActivityRouter {
  private readonly router: Router;
  private readonly controller: ActivityController;

  constructor(controller: ActivityController = new ActivityController()) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get(
      ActivityConstants.ROUTES.ROOT,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      this.controller.LIST_LOGS,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const activityRouter = new ActivityRouter().getRouter();
export default activityRouter;
