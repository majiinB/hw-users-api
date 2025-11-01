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
    /**
   * Find counselors by college department
   */
  async findByDepartment(departmentName: string): Promise<Counselor[]> {
    const query = `
      SELECT 
        c.user_id,
        c.user_name,
        c.email,
        c.password,
        c.is_deleted,
        c.department_id,
        c.created_at,
        c.updated_at,
        cd.department_name
      FROM counselor c
      INNER JOIN college_departments cd ON c.department_id = cd.department_id
      WHERE cd.department_name = $1
        AND c.is_deleted = false
      ORDER BY c.user_name ASC
    `;
  
    const result = await AppDataSource.query(query, [departmentName]);
    return result;
  }
  
  /**
   * Find counselors by college department without password (for safe responses)
   */
  async findByDepartmentWithoutPassword(departmentName: string): Promise<Omit<Counselor, 'password'>[]> {
    const query = `
      SELECT 
        c.user_id,
        c.user_name,
        c.email,
        c.is_deleted,
        c.department_id,
        c.created_at,
        c.updated_at,
        cd.department_name
      FROM counselor c
      INNER JOIN college_departments cd ON c.department_id = cd.department_id
      WHERE cd.department_name = $1
        AND c.is_deleted = false
      ORDER BY c.user_name ASC
    `;
  
    const result = await AppDataSource.query(query, [departmentName]);
    return result;
  }

  public async findAllWithoutPassword(): Promise<Omit<Counselor, 'password'>[]> {
  const query = `
    SELECT 
      c.user_id,
      c.user_name,
      c.email,
      c.is_deleted,
      c.department_id,
      c.created_at,
      c.updated_at,
      cd.department_name
    FROM counselor c
    INNER JOIN college_departments cd ON c.department_id = cd.department_id
    WHERE c.is_deleted = false
    ORDER BY cd.department_name ASC, c.user_name ASC
  `;

  const result = await AppDataSource.query(query);
  return result;
}
}