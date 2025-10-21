import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/datasource.config.js";
import { CounselorRefreshToken } from "../models/counselorRefreshToken.model.js";
import type { AdminRefreshToken } from "../models/adminRefreshToken.model.js";

/**
 * Counselor Refresh Token Repository
 *
 * @description Repository class for managing counselor refresh tokens.
 *
 * Provides methods to query, save, and delete refresh token records
 * in the database using TypeORM.
 * 
 * @file adminRefreshToken.repository.ts
 * 
 * @author Arthur M. Artugue
 * @created 2025-10-16
 * @updated 2025-10-16
 */
export class CounselorRefreshTokenRepository {
  private repo = AppDataSource.getRepository(CounselorRefreshToken);

  async findByUserIDAndToken(userID: string, token: string): Promise<CounselorRefreshToken | null> {
    return this.repo.findOne({
       where: { 
        token: token,
        counselor: {user_id : userID}
      },
      relations: ["counselor"]
    });
  }

  async findByUserID(userID: string): Promise<CounselorRefreshToken | null> {
    return this.repo.findOne({
      where: {
        counselor : {user_id: userID}
      }
    })
  }

  async save(token: CounselorRefreshToken, manager?: EntityManager): Promise<CounselorRefreshToken> {
    if (manager) {
      return manager.save(CounselorRefreshToken, token);
    }
    return this.repo.save(token);
  }

  async delete(token: CounselorRefreshToken, manager?: EntityManager): Promise<void> {
    if (manager) {
      await manager.remove(CounselorRefreshToken, token);
      return;
    }
    await this.repo.remove(token);
  }
}