import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorizeRoles } from "../../../middleware/role.middleware";
import { CertificateConstants } from "./certificate.constants";
import { CertificateValidator } from "./certificate.validator";
import { CertificateController } from "./certificate.controller";

/**
 * GDG Ranchi DevFest 2026 - Certificate Router
 */
export class CertificateRouter {
  private readonly router: Router;
  private readonly controller: CertificateController;

  constructor(controller: CertificateController = new CertificateController()) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  private initRoutes(): void {
    // Public verification endpoint
    this.router.get(
      CertificateConstants.ROUTES.VERIFY,
      CertificateValidator.VALIDATE_VERIFY,
      this.controller.VERIFY,
    );

    // Current participant certificate
    this.router.get(
      CertificateConstants.ROUTES.MY_CERTIFICATE,
      authenticate,
      this.controller.GET_MY_CERTIFICATE,
    );

    // Super Admin issue certificate
    this.router.post(
      CertificateConstants.ROUTES.GENERATE,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      CertificateValidator.VALIDATE_ISSUE,
      this.controller.GENERATE,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const certificateRouter = new CertificateRouter().getRouter();
export default certificateRouter;
