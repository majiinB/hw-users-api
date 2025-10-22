import type {Response, Request, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ClassificationEnum } from "../types/studentClassification.type.js";
import { logger } from "../utils/logger.util.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { comparePassword } from "../utils/crypt.util.js";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  public async handleFetchingAllStudents(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const { role, college_department } = req.user ?? {};

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.");
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

    const response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Students fetched successfully.",
      data: result
    }

    res.status(200).json(response);
  }

  public async handleFetchingSpecificStudent(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const studentId = req.params.studentId;
    const { email, password } = req.body ?? {};
    const { role } = req.user ?? {};

    if (!email || !password) {
      throw new AppError(
        400,
        "MISSING_ADMIN_CREDENTIALS",
        "This action requires proper credentials.",
        true
      ) // Stop execution if missing
    }

    const result = await this.userService.getStudentById(email, password, role!, studentId);

    const response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Student fetched successfully.",
      data: result
    }

    res.status(200).json(response);
  }
}