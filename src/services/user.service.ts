import type { AdminRepository } from "../repository/admin.repository.js";
import type { CounselorRepository } from "../repository/counselor.repository.js";
import { type PaginatedStudentClassifications, StudentClassificationRepository, type StudentClassificationFilters } from "../repository/studentClassification.repository.js";
import type { Admin } from "../types/admin.type.js";
import { AppError } from "../types/appError.type.js";
import type { Counselor } from "../types/counselor.type.js";
import type { DepartmentStatistics } from "../types/departmentStatistics.type.js";
import type { ClassificationEnum, StudentClassification } from "../types/studentClassification.type.js";
import { comparePassword } from "../utils/crypt.util.js";
import { logger } from "../utils/logger.util.js";

export class UserService {
  private studentClassificationRepo: StudentClassificationRepository;
  private adminRepository: AdminRepository;
  private counselorRepository: CounselorRepository;

  constructor(studentClassificationRepo: StudentClassificationRepository, adminRepository: AdminRepository, counselorRepository: CounselorRepository) {
    this.studentClassificationRepo = studentClassificationRepo;
    this.adminRepository = adminRepository;
    this.counselorRepository = counselorRepository;
  }

  private anonymizeEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    
    if (localPart.length <= 2) {
      return `${localPart[0]}****@${domain}`;
    }

    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    const middleLength = localPart.length - 2;
    const stars = '****';

    return `${firstChar}${stars}${lastChar}@${domain}`;
  }

  public async getStudents(
    college_department?: string, 
    classification?: ClassificationEnum, 
    limit?: number, 
    cursor?: string, 
  ): Promise<PaginatedStudentClassifications> {

    const filters: StudentClassificationFilters = {
      departmentName: college_department,
      classification,
      limit,
      cursor,
    };

    const result = await this.studentClassificationRepo.findAll(filters);

    // Anonymize emails in the result
    const anonymizedClassifications = result.classifications.map(classification => ({
      ...classification,
      email: this.anonymizeEmail(classification.email)
    }));

    return {
      ...result,
      classifications: anonymizedClassifications
    };
  }

  public async getStudentById(email: string, password: string, role: string, studentId: string): Promise<StudentClassification | null> {

    if (role === "admin" || role === "super_admin") {
      const admin : Admin | null = await this.adminRepository.findByEmail(email);

      if (!admin) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid credentials provided. please try again.",
          true
        ); 
      }

      if (!comparePassword(password, admin.password)) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid credentials provided. please try again.",
          true
        ); 
      }
    }

    const studentClassification : StudentClassification | null = await this.studentClassificationRepo.findByStudentId(studentId);

    if (role === "counselor") {
      const counselor : Counselor | null = await this.counselorRepository.findByEmail(email);

      if (!counselor) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid credentials provided. please try again.",
          true
        ); 
      }

      if (!comparePassword(password, counselor.password)) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid credentials provided. please try again.",
          true
        ); 
      }
      logger.info(studentClassification?.department_id);
      logger.info(counselor.department_id);
      if ((studentClassification?.department_id !== counselor.department_id)) {
        throw new AppError(
          403,
          "FORBIDDEN_ACCESS",
          "You do not have permission to access this student's information.",
          true
        ); 
      }
    }

    return studentClassification;
  }

  public async getDepartmentStatistics(departmentName: string): Promise<DepartmentStatistics | null> {
    return this.studentClassificationRepo.getDepartmentStatistics(departmentName);
  }

  public async getAllDepartmentStatistics(): Promise<DepartmentStatistics[] | null> {
    return this.studentClassificationRepo.getAllDepartmentsStatistics();
  }

  public async getCounselorByDepartment(departmentId: string): Promise<Promise<Omit<Counselor, 'password'>[]> | null> {
    return this.counselorRepository.findByDepartmentWithoutPassword(departmentId);
  } 

  public async getAllCounselors(): Promise<Omit<Counselor, 'password'>[]> {
    return await this.counselorRepository.findAllWithoutPassword();
  }
}