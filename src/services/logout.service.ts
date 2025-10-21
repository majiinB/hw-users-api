import type { AdminRefreshTokenRepository } from "../repository/adminRefreshToken.repository.js";
import type { CounselorRefreshTokenRepository } from "../repository/counselorRefreshToken.repository.js";
import type { StudentRefreshTokenRepository } from "../repository/studentRefreshToken.repository.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { verifyToken } from "../utils/jwt.util.js";


export class LogoutService {
  private studentRefreshTokenRepo: StudentRefreshTokenRepository;
  private adminRefreshTokenRepo: AdminRefreshTokenRepository;
  private counselorRefreshTokenRepo: CounselorRefreshTokenRepository;

  constructor(studentRefreshTokenRepo: StudentRefreshTokenRepository, adminRefreshTokenRepo: AdminRefreshTokenRepository, counselorRefreshTokenRepo: CounselorRefreshTokenRepository) {
    this.studentRefreshTokenRepo = studentRefreshTokenRepo;
    this.adminRefreshTokenRepo = adminRefreshTokenRepo;
    this.counselorRefreshTokenRepo = counselorRefreshTokenRepo;
  }

  public async studentlogout(refreshToken: string): Promise<ApiResponse> {
    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload?.sub) {
      throw new AppError(
        400,
        "INVALID_REFRESH_TOKEN",
        "Refresh token payload missing user ID.",
        true
      );
    }

    const storedToken = await this.studentRefreshTokenRepo.findByUserIDAndToken(payload.sub, refreshToken);

    if (!storedToken) {
      throw new AppError(
        401,
        "REFRESH_TOKEN_NOT_FOUND",
        "Refresh token not found or already invalidated.",
        true
      );
    }

    // Delete refresh token (invalidate session)
    await this.studentRefreshTokenRepo.delete(storedToken);

    return {
      success: true,
      code: "LOGOUT_SUCCESS",
      message: "User logged out successfully.",
    };
  }

  public async counselorLogout(refreshToken: string): Promise<ApiResponse> {
    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload?.sub) {
      throw new AppError(
        400,
        "INVALID_REFRESH_TOKEN",
        "Refresh token payload missing user ID.",
        true
      );
    }

    const storedToken = await this.counselorRefreshTokenRepo.findByUserIDAndToken(payload.sub, refreshToken);

    if (!storedToken) {
      throw new AppError(
        401,
        "REFRESH_TOKEN_NOT_FOUND",
        "Refresh token not found or already invalidated.",
        true
      );
    }

    // Delete refresh token (invalidate session)
    await this.counselorRefreshTokenRepo.delete(storedToken);

    return {
      success: true,
      code: "LOGOUT_SUCCESS",
      message: "Counselor logged out successfully.",
    };
  }

  public async adminLogout(refreshToken: string): Promise<ApiResponse> {
    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload?.sub) {
      throw new AppError(
        400,
        "INVALID_REFRESH_TOKEN",
        "Refresh token payload missing user ID.",
        true
      );
    }

    const storedToken = await this.adminRefreshTokenRepo.findByUserIDAndToken(payload.sub, refreshToken);

    if (!storedToken) {
      throw new AppError(
        401,
        "REFRESH_TOKEN_NOT_FOUND",
        "Refresh token not found or already invalidated.",
        true
      );
    }

    // Delete refresh token (invalidate session)
    await this.adminRefreshTokenRepo.delete(storedToken);

    return {
      success: true,
      code: "LOGOUT_SUCCESS",
      message: "Admin logged out successfully.",
    };
  }
}