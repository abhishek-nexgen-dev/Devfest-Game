import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { RegistrationConstants } from "./registration.constants";
import { RegistrationValidator } from "./registration.validator";
import { RegistrationController } from "./registration.controller";

/**
 * GDG Ranchi DevFest 2026 - Registration Router
 */
export class RegistrationRouter {
  private readonly router: Router;
  private readonly controller: RegistrationController;

  constructor(controller: RegistrationController = new RegistrationController()) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      RegistrationConstants.ROUTES.ROOT,
      authenticate,
      RegistrationValidator.VALIDATE_REGISTER,
      this.controller.REGISTER,
    );
    this.router.get(
      RegistrationConstants.ROUTES.BY_GAME,
      authenticate,
      RegistrationValidator.VALIDATE_GAME_PARAMS,
      this.controller.LIST_BY_GAME,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const registrationRouter = new RegistrationRouter().getRouter();
export default registrationRouter;
