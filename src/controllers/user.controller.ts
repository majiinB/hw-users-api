import type {Response, Request, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ClassificationEnum } from "../types/studentClassification.type.js";
import { logger } from "../utils/logger.util.js";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  public async handleFetchingAllStudents(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { role, college_department } = req.user ?? {};
      logger.info(`User role: ${role}, Department: ${college_department}`);

      if (!role) {
        res.status(400).json({
          success: false,
          code: "MISSING_USER_INFO",
          message: "User role is required.",
        });
        return;
      }

      // Get query parameters
      const classification = req.query.classification as ClassificationEnum | undefined;
      const isFlagged = req.query.isFlagged === 'true' ? true : req.query.isFlagged === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      // Counselors can only see their department, admins/super_admins see all
      const departmentFilter = (role === 'counselor' && college_department) ? college_department : undefined;

      const result = await this.userService.getStudents(
        departmentFilter,
        classification,
        limit,
        cursor,
        isFlagged
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch students",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}