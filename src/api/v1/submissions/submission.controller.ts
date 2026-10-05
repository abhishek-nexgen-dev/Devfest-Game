import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";
import { SubmissionConstants } from "./submission.constants";
import { SubmissionService } from "./submission.service";

/**
 * GDG Ranchi DevFest 2026 - Submission Controller
 */
export class SubmissionController {
  private readonly submissionService: SubmissionService;

  constructor(submissionService: SubmissionService = new SubmissionService()) {
    this.submissionService = submissionService;
  }

  public CREATE = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const participantId = req.user?.participantId || req.user?.userId;
      if (!participantId) {
        throw new UnauthorizedError();
      }

      const submission = await this.submissionService.CREATE_SUBMISSION(participantId, req.body);
      sendSuccess(res, submission, SubmissionConstants.MESSAGES.SUBMIT_SUCCESS, 201);
    } catch (error) {
      next(error);
    }
  };

  public LIST_BY_GAME = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submissions = await this.submissionService.LIST_BY_GAME(req.params.gameId);
      sendSuccess(res, submissions, SubmissionConstants.MESSAGES.SUBMISSIONS_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_BY_ID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await this.submissionService.GET_BY_ID(req.params.id);
      sendSuccess(res, submission, SubmissionConstants.MESSAGES.SUBMISSIONS_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };
}
