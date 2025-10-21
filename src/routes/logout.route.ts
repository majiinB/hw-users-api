import express from 'express'
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { LogoutController } from "../controllers/logout.controller.js"
import { LogoutService } from "../services/logout.service.js";
import { StudentRefreshTokenRepository } from "../repository/studentRefreshToken.repository.js";
import { AdminRefreshTokenRepository } from '../repository/adminRefreshToken.repository.js';
import { CounselorRefreshTokenRepository } from '../repository/counselorRefreshToken.repository.js';

const router = express.Router();
const studentTokenRepo = new StudentRefreshTokenRepository();
const adminTokenRepo = new AdminRefreshTokenRepository();
const counselorTokenRepo = new CounselorRefreshTokenRepository();
const logoutService = new LogoutService(studentTokenRepo, adminTokenRepo, counselorTokenRepo);
const logoutController = new LogoutController(logoutService);

/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         code:
 *           type: string
 *           example: BAD_REQUEST
 *         message:
 *           type: string
 *           example: Invalid input data
 */

/**
 * @openapi
 * /student/logout:
 *   post:
 *     summary: Student logout
 *     description: |
 *       Logs out a student by invalidating the provided refresh token.  
 *       - The refresh token must be supplied in the request body.  
 *       - If valid, the refresh token will be deleted from the database, ending the session.  
 *       - If missing or invalid, the request will fail with an appropriate error response.
 *     tags:
 *       - Student Authentication
 *     security: []   # No bearerAuth required, only refresh token in body
 *     requestBody:
 *       required: true
 *       description: The refresh token that should be invalidated on logout.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token to be invalidated
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *     responses:
 *       "200":
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: LOGOUT_SUCCESS
 *                 message:
 *                   type: string
 *                   example: User logged out successfully.
 *             examples:
 *               logoutSuccess:
 *                 value:
 *                   success: true
 *                   code: LOGOUT_SUCCESS
 *                   message: User logged out successfully.
 *       "400":
 *         description: Bad request - missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingRefreshToken:
 *                 value:
 *                   success: false
 *                   code: MISSING_REFRESH_TOKEN
 *                   message: Refresh token is required to logout.
 *               invalidRefreshToken:
 *                 value:
 *                   success: false
 *                   code: INVALID_REFRESH_TOKEN
 *                   message: Refresh token payload missing user ID.
 *       "401":
 *         description: Unauthorized - refresh token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tokenNotFound:
 *                 value:
 *                   success: false
 *                   code: REFRESH_TOKEN_NOT_FOUND
 *                   message: Refresh token not found or already invalidated.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Internal server error
 */
router.post('/student/logout',asyncHandler(logoutController.handleStudentLogout.bind(logoutController)));

/**
 * @openapi
 * /admin/logout:
 *   post:
 *     summary: Admin logout
 *     description: |
 *       Logs out an admin by invalidating the provided refresh token.  
 *       - The refresh token must be supplied in the request body.  
 *       - If valid, the refresh token will be deleted from the database, ending the session.  
 *       - If missing or invalid, the request will fail with an appropriate error response.
 *     tags:
 *       - Admin Authentication
 *     security: []   # No bearerAuth required, only refresh token in body
 *     requestBody:
 *       required: true
 *       description: The refresh token that should be invalidated on logout.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token to be invalidated
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *     responses:
 *       "200":
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: LOGOUT_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Admin logged out successfully.
 *             examples:
 *               logoutSuccess:
 *                 value:
 *                   success: true
 *                   code: LOGOUT_SUCCESS
 *                   message: Admin logged out successfully.
 *       "400":
 *         description: Bad request - missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingRefreshToken:
 *                 value:
 *                   success: false
 *                   code: MISSING_REFRESH_TOKEN
 *                   message: Refresh token is required to logout.
 *               invalidRefreshToken:
 *                 value:
 *                   success: false
 *                   code: INVALID_REFRESH_TOKEN
 *                   message: Refresh token payload missing user ID.
 *       "401":
 *         description: Unauthorized - refresh token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tokenNotFound:
 *                 value:
 *                   success: false
 *                   code: REFRESH_TOKEN_NOT_FOUND
 *                   message: Refresh token not found or already invalidated.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Internal server error
 */
router.post('/admin/logout',asyncHandler(logoutController.handleAdminLogout.bind(logoutController)));

/**
 * @openapi
 * /counselor/logout:
 *   post:
 *     summary: Counselor logout
 *     description: |
 *       Logs out a counselor by invalidating the provided refresh token.  
 *       - The refresh token must be supplied in the request body.  
 *       - If valid, the refresh token will be deleted from the database, ending the session.  
 *       - If missing or invalid, the request will fail with an appropriate error response.
 *     tags:
 *       - Counselor Authentication
 *     security: []   # No bearerAuth required, only refresh token in body
 *     requestBody:
 *       required: true
 *       description: The refresh token that should be invalidated on logout.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token to be invalidated
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *     responses:
 *       "200":
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: LOGOUT_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Counselor logged out successfully.
 *             examples:
 *               logoutSuccess:
 *                 value:
 *                   success: true
 *                   code: LOGOUT_SUCCESS
 *                   message: Counselor logged out successfully.
 *       "400":
 *         description: Bad request - missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingRefreshToken:
 *                 value:
 *                   success: false
 *                   code: MISSING_REFRESH_TOKEN
 *                   message: Refresh token is required to logout.
 *               invalidRefreshToken:
 *                 value:
 *                   success: false
 *                   code: INVALID_REFRESH_TOKEN
 *                   message: Refresh token payload missing user ID.
 *       "401":
 *         description: Unauthorized - refresh token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tokenNotFound:
 *                 value:
 *                   success: false
 *                   code: REFRESH_TOKEN_NOT_FOUND
 *                   message: Refresh token not found or already invalidated.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Internal server error
 */
router.post('/counselor/logout',asyncHandler(logoutController.handleCounselorLogout.bind(logoutController)));

export default router;