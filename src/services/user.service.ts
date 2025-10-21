import { type PaginatedStudentClassifications, StudentClassificationRepository, type StudentClassificationFilters } from "../repository/studentClassification.repository.js";
import type { ClassificationEnum } from "../types/studentClassification.type.js";

export class UserService {
  private studentClassificationRepo: StudentClassificationRepository;

  constructor(studentClassificationRepo: StudentClassificationRepository) {
    this.studentClassificationRepo = studentClassificationRepo;
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
    isFlagged?: boolean
  ): Promise<PaginatedStudentClassifications> {

    const filters: StudentClassificationFilters = {
      departmentName: college_department,
      classification,
      isFlagged,
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
}