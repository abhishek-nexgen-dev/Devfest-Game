import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { CertificateConstants } from "./certificate.constants";
import { CertificateService } from "./certificate.service";

/**
 * GDG Ranchi DevFest 2026 - Certificate Controller
 */
export class CertificateController {
  private readonly certificateService: CertificateService;

  constructor(certificateService: CertificateService = new CertificateService()) {
    this.certificateService = certificateService;
  }

  public GENERATE = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cert = await this.certificateService.ISSUE_CERTIFICATE(req.body);
      sendSuccess(res, cert, CertificateConstants.MESSAGES.ISSUED, 201);
    } catch (error) {
      next(error);
    }
  };

  public VERIFY = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cert = await this.certificateService.VERIFY_CERTIFICATE(req.params.hash);
      sendSuccess(res, cert, CertificateConstants.MESSAGES.VERIFIED, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_MY_CERTIFICATE = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const participantId = req.user?.participantId || req.user?.userId;
      const cert = await this.certificateService.GET_BY_PARTICIPANT(participantId || "");
      sendSuccess(res, cert, CertificateConstants.MESSAGES.VERIFIED, 200);
    } catch (error) {
      next(error);
    }
  };
}
