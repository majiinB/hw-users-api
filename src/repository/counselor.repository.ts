import { AppDataSource } from "../config/datasource.config.js";
import type { Counselor } from "../types/counselor.type.js";

export class CounselorRepository {
  /**
   * Find a counselor by email (for login/authentication)
   * Returns null if counselor not found or is deleted
   */
  async findByEmail(email: string): Promise<Counselor | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_deleted,
        department_id,
        created_at,
        updated_at
      FROM counselor
      WHERE email = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a counselor by user_id
   * Returns null if counselor not found or is deleted
   */
  async findById(userId: string): Promise<Counselor | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_deleted,
        college_department,
        created_at,
        updated_at
      FROM counselor
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a counselor by email without password (for safe responses)
   * Returns null if counselor not found or is deleted
   */
  async findByEmailWithoutPassword(email: string): Promise<Omit<Counselor, 'password'> | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_deleted,
        college_department,
        created_at,
        updated_at
      FROM counselor
      WHERE email = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a counselor by user_id without password (for safe responses)
   * Returns null if counselor not found or is deleted
   */
  async findByIdWithoutPassword(userId: string): Promise<Omit<Counselor, 'password'> | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_deleted,
        college_department,
        created_at,
        updated_at
      FROM counselor
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Check if a counselor exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM counselor 
        WHERE email = $1 
          AND is_deleted = false
      ) as exists
    `;

    const result = await AppDataSource.query(query, [email]);
    return result[0].exists;
  }

  /**
   * Find counselors by college department
   */
  async findByDepartment(departmentId: number): Promise<Counselor[]> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_deleted,
        college_department,
        created_at,
        updated_at
      FROM counselor
      WHERE college_department = $1
        AND is_deleted = false
      ORDER BY user_name ASC
    `;

    const result = await AppDataSource.query(query, [departmentId]);
    return result;
  }

  /**
   * Find counselors by college department without password (for safe responses)
   */
  async findByDepartmentWithoutPassword(departmentId: number): Promise<Omit<Counselor, 'password'>[]> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_deleted,
        college_department,
        created_at,
        updated_at
      FROM counselor
      WHERE college_department = $1
        AND is_deleted = false
      ORDER BY user_name ASC
    `;

    const result = await AppDataSource.query(query, [departmentId]);
    return result;
  }
}