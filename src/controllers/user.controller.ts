import type {Response, Request, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ClassificationEnum } from "../types/studentClassification.type.js";
import { logger } from "../utils/logger.util.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { comparePassword } from "../utils/crypt.util.js";
import type { DepartmentStatistics } from "../types/departmentStatistics.type.js";

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
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const cursor = req.query.cursor as string | undefined;

    // Counselors can only see their department, admins/super_admins see all
    const departmentFilter = (role === 'counselor' && college_department) ? college_department : undefined;

    const result = await this.userService.getStudents(
      departmentFilter,
      classification,
      limit,
      cursor,
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

  public async handleFetchingDepartmentStatistics(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;
    let result : DepartmentStatistics | DepartmentStatistics[] | null;

    if (role === "admin" || role === "super_admin") {
      result = await this.userService.getAllDepartmentStatistics();
    } else if (role === "counselor") {
      const departmentName = req.user?.college_department;
      if (!departmentName) {
        throw new AppError(400, "MISSING_DEPARTMENT_INFO", "Department information is required.");
      }
      result = await this.userService.getDepartmentStatistics(departmentName);
    }

    const response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Department statistics fetched successfully.",
      data: result!
    }

    res.status(200).json(response);
  }

  public async handleFetchingAllDepartmentCounselors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const userRole = req.user?.role;
    const department = req.user?.college_department;

    if (!userRole) {
      throw new AppError(
        400,
        "MISSING_USER_INFO",
        "User role is required.",
        true
      );
    }

    let response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Counselors fetched successfully.",
      data: []
    };

    if (userRole === "admin" || userRole === "super_admin") {
      const result = await this.userService.getAllCounselors();
      response = {
        success: true,
        code: "FETCHED_SUCCESSFULLY",
        message: "Counselors fetched successfully.",
        data: result
      };

      res.status(200).json(response);
    }

    if (!department) {
      throw new AppError(
        400,
        "MISSING_DEPARTMENT_INFO",
        "College department information is required.",
        true
      );
    }

    const result = await this.userService.getCounselorByDepartment(department);

    if(userRole === "counselor" || userRole === "student") {
      response = {
        success: true,
        code: "FETCHED_SUCCESSFULLY",
        message: "Counselors fetched successfully.",
        data: result !== null ? result.map(counselor => {
          const { 
            is_deleted,  
            created_at,
            updated_at,
            ...counselorWithoutPassword } = counselor;
          return counselorWithoutPassword;
        }) : []
      };
    }
    
    res.status(200).json(response);
  }
}