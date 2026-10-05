import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { SubmissionConstants } from "./submission.constants";
import { SubmissionValidator } from "./submission.validator";
import { SubmissionController } from "./submission.controller";

/**
 * GDG Ranchi DevFest 2026 - Submission Router
 */
export class SubmissionRouter {
  private readonly router: Router;
  private readonly controller: SubmissionController;

  constructor(controller: SubmissionController = new SubmissionController()) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      SubmissionConstants.ROUTES.ROOT,
      authenticate,
      SubmissionValidator.VALIDATE_CREATE,
      this.controller.CREATE,
    );
    this.router.get(SubmissionConstants.ROUTES.BY_GAME, authenticate, this.controller.LIST_BY_GAME);
    this.router.get(
      SubmissionConstants.ROUTES.BY_ID,
      authenticate,
      SubmissionValidator.VALIDATE_PARAMS_ID,
      this.controller.GET_BY_ID,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const submissionRouter = new SubmissionRouter().getRouter();
export default submissionRouter;
