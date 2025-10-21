import { DataSource } from 'typeorm';
import type { StudentClassification, ClassificationEnum } from '../types/studentClassification.type.js';

export interface StudentClassificationFilters {
  studentId?: string;
  classification?: ClassificationEnum;
  isFlagged?: boolean;
  departmentId?: number;
  limit?: number;
  cursor?: string; // classification_id of the last item from previous page
}

export type PaginatedStudentClassifications = {
  classifications: StudentClassification[];
  hasMore: boolean;
  nextCursor?: string; // classification_id of the last classification for the next page
}

export class StudentClassificationRepository {
  constructor(private dataSource: DataSource) {}

  async findAll(filters: StudentClassificationFilters = {}): Promise<PaginatedStudentClassifications> {
    const {
      classification,
      isFlagged,
      departmentId,
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

    if (departmentId !== undefined) {
      conditions.push(`s.college_program = $${paramIndex++}`);
      parameters.push(departmentId);
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
        s.user_name,
        s.email,
        s.college_program as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_departments cd ON s.college_program = cd.department_id
      ${whereClause}
      ORDER BY sc.classified_at DESC, sc.classification_id DESC
      LIMIT $${paramIndex++}
    `;

    const data = await this.dataSource.query(dataQuery, [...parameters, limit + 1]);

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
        s.college_program as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_departments cd ON s.college_program = cd.department_id
      WHERE sc.student_id = $1
        AND s.is_deleted = false
      ORDER BY sc.classified_at DESC
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [studentId]);
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
    departmentId: number,
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ departmentId, limit, cursor });
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
        s.college_program as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_departments cd ON s.college_program = cd.department_id
      WHERE sc.classification_id = $1
        AND s.is_deleted = false
    `;

    const result = await this.dataSource.query(query, [classificationId]);
    return result.length > 0 ? result[0] : null;
  }
}