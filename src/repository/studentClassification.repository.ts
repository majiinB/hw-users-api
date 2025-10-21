import { AppDataSource } from "../config/datasource.config.js";
import type { StudentClassification, ClassificationEnum } from '../types/studentClassification.type.js';

/**
 * Filters for querying student classifications.
 * 
 * @interface StudentClassificationFilters
 * @property {ClassificationEnum} [classification] - The classification type to filter by
 * @property {boolean} [isFlagged] - Whether to filter by flagged status
 * @property {string} [departmentName] - The department name to filter by
 * @property {number} [limit] - Maximum number of results to return
 * @property {string} [cursor] - Classification ID of the last item from the previous page for pagination
 */
export interface StudentClassificationFilters {
  classification?: ClassificationEnum;
  isFlagged?: boolean;
  departmentName?: string;
  limit?: number;
  cursor?: string; // classification_id of the last item from previous page
}

export type PaginatedStudentClassifications = {
  classifications: StudentClassification[];
  hasMore: boolean;
  nextCursor?: string; // classification_id of the last classification for the next page
}

export class StudentClassificationRepository {
  async findAll(filters: StudentClassificationFilters = {}): Promise<PaginatedStudentClassifications> {
    const {
      classification,
      isFlagged,
      departmentName,
      limit = 10,
      cursor
    } = filters;

    const conditions: string[] = ['s.is_deleted = false'];
    const parameters: any[] = [];
    let paramIndex = 1;

    if (classification) {
      conditions.push(`sc.classification = $${paramIndex++}`);
      parameters.push(classification);
    }

    if (isFlagged !== undefined) {
      conditions.push(`sc.is_flagged = $${paramIndex++}`);
      parameters.push(isFlagged);
    }

    if (departmentName !== undefined) {
      conditions.push(`cd.department_name = $${paramIndex++}`);
      parameters.push(departmentName);
    }

    if (cursor) {
      conditions.push(`(sc.classified_at, sc.classification_id) < (
        SELECT classified_at, classification_id 
        FROM student_classification 
        WHERE classification_id = $${paramIndex++}
      )`);
      parameters.push(cursor);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Fetch limit + 1 to check if there are more results
    const dataQuery = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.is_flagged,
        sc.classified_at,
        s.email,
        cp.college_department_id as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.program_id = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      ${whereClause}
      ORDER BY sc.classified_at DESC, sc.classification_id DESC
      LIMIT $${paramIndex++}
    `;

    const data = await AppDataSource.query(dataQuery, [...parameters, limit + 1]);

    const hasMore = data.length > limit;
    const classifications = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? classifications[classifications.length - 1].classification_id : undefined;

    return {
      classifications,
      hasMore,
      nextCursor
    };
  }

  async findByStudentId(studentId: string): Promise<StudentClassification | null> {
    const query = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.is_flagged,
        sc.classified_at,
        s.user_name,
        s.email,
        cp.college_department as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.college_program = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department = cd.department_id
      WHERE sc.student_id = $1
        AND s.is_deleted = false
      ORDER BY sc.classified_at DESC
      LIMIT 1
    `;

    const result = await AppDataSource.query(query, [studentId]);
    return result.length > 0 ? result[0] : null;
  }

  async findByClassification(
    classification: ClassificationEnum,
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ classification, limit, cursor });
  }

  async findFlagged(
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ isFlagged: true, limit, cursor });
  }

  async findByDepartment(
    departmentName: string,
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ departmentName, limit, cursor });
  }

  async findById(classificationId: string): Promise<StudentClassification | null> {
    const query = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.is_flagged,
        sc.classified_at,
        s.user_name,
        s.email,
        cp.college_department as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.college_program = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      WHERE sc.classification_id = $1
        AND s.is_deleted = false
    `;

    const result = await AppDataSource.query(query, [classificationId]);
    return result.length > 0 ? result[0] : null;
  }
}