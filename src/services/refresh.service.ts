import ms from "ms";
import type { Student } from "../models/student.model.js";
import { StudentRefreshToken } from "../models/studentRefreshToken.model.js";
import type { StudentRefreshTokenRepository } from "../repository/studentRefreshToken.repository.js";
import type { AccessTokenClaims } from "../types/accessTokenClaim.type.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.util.js";
import { env } from "../config/env.config.js";
import { AppDataSource } from "../config/datasource.config.js";
import { AdminRefreshToken } from "../models/adminRefreshToken.model.js";
import { CounselorRefreshToken } from "../models/counselorRefreshToken.model.js";
import { AdminRefreshTokenRepository } from "../repository/adminRefreshToken.repository.js";
import { Admin } from "../models/admin.model.js";
import type { CounselorRefreshTokenRepository } from "../repository/counselorRefreshToken.repository.js";
import type { Counselor } from "../models/counselor.model.js";

/**
 * RefreshToken Service
 * 
 * @description Handles verification of refresh tokens and issuing of new access/refresh tokens.
 * 
 * @file refresh-token.service.ts
 * 
 * @author Arthur M. Artugue
 * @created 2025-09-04
 * @updated 2025-10-18
 */
export class RefreshTokenService {
  private studentRefreshTokenRepo: StudentRefreshTokenRepository;
  private adminRefreshTokenRepo: AdminRefreshTokenRepository;
  private counselorRefreshTokenRepo: CounselorRefreshTokenRepository;

  constructor(
    studentRefreshTokenRepo: StudentRefreshTokenRepository,
    adminRefreshTokenRepo: AdminRefreshTokenRepository,
    counselorRefreshTokenRepo: CounselorRefreshTokenRepository
  ){
    this.studentRefreshTokenRepo = studentRefreshTokenRepo;
    this.adminRefreshTokenRepo = adminRefreshTokenRepo;
    this.counselorRefreshTokenRepo = counselorRefreshTokenRepo;
  }

  /**
   * Rotates a student's refresh token and issues a new access token.
   *
   * Workflow:
   * - Validates that the provided refresh token exists for the specified user.
   * - Checks expiry; expired tokens are removed and an error is thrown.
   * - Verifies the referenced student still exists; if not, the token is removed and an error is thrown.
   * - Builds access token claims (subject, role based on onboarding status, email, name, is_onboarded, and optional college metadata).
   * - Generates a new access token and a new refresh token.
   * - Atomically deletes the old refresh token and persists the new one within a database transaction.
   * - Returns the new tokens and onboarding status; response code/message vary based on onboarding completion.
   *
   * @param userId - The unique identifier of the student whose token is being rotated.
   * @param oldRefreshToken - The existing refresh token presented by the client for rotation.
   * @returns A promise that resolves to an ApiResponse containing:
   * - data.access_token: Newly issued access token.
   * - data.refresh_token: Newly issued refresh token.
   * - data.is_onboarded: Whether the student has completed onboarding.
   *
   * @throws {AppError} 401 INVALID_REFRESH_TOKEN - If the provided refresh token does not exist for the user.
   * @throws {AppError} 401 EXPIRED_REFRESH_TOKEN - If the provided refresh token is expired (it is deleted).
   * @throws {AppError} 404 USER_NOT_FOUND - If the student referenced by the token no longer exists (token is deleted).
   *
   * @remarks
   * - Access token claims include: sub, role ("student" or "student_pending"), email, name, is_onboarded,
   *   college_program, and college_department (the last two may be null).
   * - Refresh token TTL is derived from env.JWT_REFRESH_TOKEN_TTL (e.g., "7d"); defaults to 7 days if unset.
   * - The replacement of the refresh token is performed within a single transaction to prevent reuse windows.
   */
  public async rotateStudentToken(userId: string, oldRefreshToken: string): Promise<ApiResponse>{
    const storedToken: StudentRefreshToken | null = await this.studentRefreshTokenRepo.findByUserIDAndToken(userId, oldRefreshToken);

    // Check if the refresh token is existing and stored in the database
    if(!storedToken){
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or not found",
        true
      );
    }

    // Check if the refresh token is not expired
    if(storedToken.expires_at.getTime() < Date.now()){
      await this.studentRefreshTokenRepo.delete(storedToken);

      throw new AppError(
        401,
        "EXPIRED_REFRESH_TOKEN",
        "Refresh token expired",
        true
      );
    }

    // Check if user referenced exists
    const student: Student | null = storedToken.student;
    if(!student){
      await this.studentRefreshTokenRepo.delete(storedToken);

      throw new AppError(
        404, 
        "USER_NOT_FOUND", 
        "User linked to refresh token not found.", 
        true
      );
    }
    
    // TODO: Provide college program and department in the payload
    // User exists, generate tokens
    const payload: AccessTokenClaims = {
      sub: student.user_id,
      role: student.finished_onboarding ? "student" : "student_pending",
      email: student.email,
      name: student.user_name,
      is_onboarded: student.finished_onboarding,
      college_program: student.college_program?.program_name ?? null,
      college_department: student.college_program?.college_department_id?.department_name ?? null,
    }

    // Generate tokens
    const newAccessToken = await signAccessToken(payload);
    const newRefreshToken = await signRefreshToken(student.user_id);

    // Start a transaction
    await AppDataSource.manager.transaction(async (manager) => {
      // Replace old refresh token
      await this.studentRefreshTokenRepo.delete(storedToken, manager);

      // Save new refresh token
      const ttlString: ms.StringValue = env.JWT_REFRESH_TOKEN_TTL as ms.StringValue || "7d"; 
      const ttlMs = ms(ttlString);
      const expiresAt = new Date(Date.now() + ttlMs);
      const studentRT: StudentRefreshToken = new StudentRefreshToken(); 
      studentRT.student = student;
      studentRT.token = newRefreshToken;
      studentRT.expires_at = expiresAt
      await this.studentRefreshTokenRepo.save(studentRT, manager);
    });
    
    // Prepare response
    const response: ApiResponse = {
      success: true,
      code: student.finished_onboarding ? "ACCESS_TOKEN_REFRESS_SUCCESS" : "ACCESS_TOKEN_REFRESH_SUCCESS_ONBOARDING_REQUIRED",
      message: student.finished_onboarding ? 
      "Student access token refresh successful" : 
      "Student access token refresh successful. Onboarding required to complete your profile",
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        is_onboarded: student.finished_onboarding,
      }
    }
    return response;
  }

  /**
   * Rotates the admin's refresh token and issues a new access token.
   *
   * This method validates the provided old refresh token for the specified user,
   * checks for its existence, expiration, and associated admin user. If valid,
   * it generates new access and refresh tokens, replaces the old refresh token in
   * the database within a transaction, and returns the new tokens in the response.
   *
   * @param userId - The unique identifier of the admin user.
   * @param oldRefreshToken - The refresh token to be rotated.
   * @returns A promise that resolves to an `ApiResponse` containing the new access and refresh tokens.
   * @throws {AppError} If the refresh token is invalid, expired, or the user is not found.
   */
  public async rotateAdminToken(userId: string, oldRefreshToken: string): Promise<ApiResponse>{
    const storedToken: AdminRefreshToken | null = await this.adminRefreshTokenRepo.findByUserIDAndToken(userId, oldRefreshToken);

    // Check if the refresh token is existing and stored in the database
    if(!storedToken){
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or not found",
        true
      );
    }

    // Check if the refresh token is not expired
    if(storedToken.expires_at.getTime() < Date.now()){
      await this.adminRefreshTokenRepo.delete(storedToken);

      throw new AppError(
        401,
        "EXPIRED_REFRESH_TOKEN",
        "Refresh token expired",
        true
      );
    }

    // Check if user referenced exists
    const admin: Admin | null = storedToken.admin;
    if(!admin){
      await this.adminRefreshTokenRepo.delete(storedToken);

      throw new AppError(
        404, 
        "USER_NOT_FOUND", 
        "User linked to refresh token not found.", 
        true
      );
    }
    
    // User exists, generate tokens
    const payload: AccessTokenClaims = {
      sub: admin.user_id,
      role: admin.is_super_admin ? "super_admin" : "admin",
      email: admin.email,
      name: admin.user_name,
    }

    // Generate tokens
    const newAccessToken = await signAccessToken(payload);
    const newRefreshToken = await signRefreshToken(admin.user_id);

    // Start a transaction
    await AppDataSource.manager.transaction(async (manager) => {
      // Replace old refresh token
      await this.adminRefreshTokenRepo.delete(storedToken, manager);

      // Save new refresh token
      const ttlString: ms.StringValue = env.JWT_REFRESH_TOKEN_TTL as ms.StringValue || "7d"; 
      const ttlMs = ms(ttlString);
      const expiresAt = new Date(Date.now() + ttlMs);
      const adminRT: AdminRefreshToken = new AdminRefreshToken(); 
      adminRT.admin = admin;
      adminRT.token = newRefreshToken;
      adminRT.expires_at = expiresAt
      await this.adminRefreshTokenRepo.save(adminRT, manager);
    });
    
    // Prepare response
    const response: ApiResponse = {
      success: true,
      code: "ACCESS_TOKEN_REFRESH_SUCCESS",
      message: "Admin access token refresh successful",
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      }
    }
    return response;
  }

  /**
   * Rotates a counselor's refresh token and issues a new access token.
   *
   * Validates the provided refresh token, ensures it is not expired and still linked to an existing counselor.
   * If valid, generates a new access token and refresh token, and atomically replaces the old refresh token in storage.
   *
   * @param userId - The counselor's user identifier (subject) requesting rotation.
   * @param oldRefreshToken - The previously issued refresh token to be rotated.
   * @returns A promise that resolves to an ApiResponse containing the new access_token and refresh_token.
   *
   * @throws AppError 401 "INVALID_REFRESH_TOKEN" - When the provided refresh token does not exist.
   * @throws AppError 401 "EXPIRED_REFRESH_TOKEN" - When the provided refresh token is expired (and subsequently deleted).
   * @throws AppError 404 "USER_NOT_FOUND" - When the counselor associated with the token no longer exists (token deleted).
   *
   * @remarks
   * - The operation runs within a database transaction to ensure the old token is removed and the new token is saved atomically.
   * - The refresh token expiration is derived from env.JWT_REFRESH_TOKEN_TTL (default "7d").
   * - The access token claims include sub, role, email, name, and college_department.
   */
  public async rotateCounselorToken(userId: string, oldRefreshToken: string): Promise<ApiResponse>{
    const storedToken: CounselorRefreshToken | null = await this.counselorRefreshTokenRepo.findByUserIDAndToken(userId, oldRefreshToken);

    // Check if the refresh token is existing and stored in the database
    if(!storedToken){
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or not found",
        true
      );
    }

    // Check if the refresh token is not expired
    if(storedToken.expires_at.getTime() < Date.now()){
      await this.counselorRefreshTokenRepo.delete(storedToken);

      throw new AppError(
        401,
        "EXPIRED_REFRESH_TOKEN",
        "Refresh token expired",
        true
      );
    }

    // Check if user referenced exists
    const counselor: Counselor | null = storedToken.counselor;
    if(!counselor){
      await this.counselorRefreshTokenRepo.delete(storedToken);

      throw new AppError(
        404, 
        "USER_NOT_FOUND", 
        "User linked to refresh token not found.", 
        true
      );
    }
    
    // User exists, generate tokens
    const payload: AccessTokenClaims = {
      sub: counselor.user_id,
      role: 'counselor',
      email: counselor.email,
      name: counselor.user_name,
      college_department: counselor.college_department?.department_name ?? null,
    }

    // Generate tokens
    const newAccessToken = await signAccessToken(payload);
    const newRefreshToken = await signRefreshToken(counselor.user_id);

    // Start a transaction
    await AppDataSource.manager.transaction(async (manager) => {
      // Replace old refresh token
      await this.counselorRefreshTokenRepo.delete(storedToken, manager);

      // Save new refresh token
      const ttlString: ms.StringValue = env.JWT_REFRESH_TOKEN_TTL as ms.StringValue || "7d"; 
      const ttlMs = ms(ttlString);
      const expiresAt = new Date(Date.now() + ttlMs);
      const counselorRt: CounselorRefreshToken = new CounselorRefreshToken();
      counselorRt.counselor = counselor;
      counselorRt.token = newRefreshToken;
      counselorRt.expires_at = expiresAt;
      await this.counselorRefreshTokenRepo.save(counselorRt, manager);
    });
    
    // Prepare response
    const response: ApiResponse = {
      success: true,
      code: "ACCESS_TOKEN_REFRESH_SUCCESS",
      message: "Counselor access token refresh successful",
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      }
    }
    return response;
  }
}