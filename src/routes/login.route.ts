import express from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { StudentRepository } from "../repository/student.repository.js";
import { LoginService } from "../services/login.service.js";
import { LoginController } from "../controllers/login.controller.js";
import { googleAuthMiddleware } from "../middlewares/googleAuth.middleware.js";
import { StudentRefreshTokenRepository } from "../repository/studentRefreshToken.repository.js";
import { AdminRepository } from "../repository/admin.repository.js";
import { AdminRefreshTokenRepository } from "../repository/adminRefreshToken.repository.js";
import { CounselorRepository } from "../repository/counselor.repository.js";
import { CounselorRefreshTokenRepository } from "../repository/counselorRefreshToken.repository.js";

const router = express.Router();
const studentRepository = new  StudentRepository();
const studentRefreshTokenRepository = new StudentRefreshTokenRepository();
const adminRepository = new AdminRepository();
const adminRefreshTokenRepository = new AdminRefreshTokenRepository();
const counselorRepository = new CounselorRepository();
const counselorRefreshTokenRepository = new CounselorRefreshTokenRepository();
const loginService = new LoginService(studentRepository, adminRepository, counselorRepository, studentRefreshTokenRepository, adminRefreshTokenRepository, counselorRefreshTokenRepository);
const loginController = new LoginController(loginService);

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
 * /student/login:
 *   post:
 *     summary: Student login with Google authentication
 *     description: |
 *       Handles student login using Google authentication.  
 *       - If the student does not exist, a new account is automatically created.  
 *       - Any existing refresh token for the student will be invalidated and replaced.  
 *       - Returns a new JWT access token and refresh token pair for secure session management.
 *     tags:
 *       - Student Authentication
 *     security: 
 *       - bearerAuth: [] 
 *     requestBody:
 *       required: true
 *       description: Google-authenticated user information injected by middleware
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.edu
 *               name:
 *                 type: string
 *                 example: Juan Dela Cruz
 *     responses:
 *       "200":
 *         description: Login successful or onboarding required
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
 *                   example: LOGIN_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Student login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: JWT access token for authenticated requests
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                     refresh_token:
 *                       type: string
 *                       description: Refresh token for session management
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                     is_onboarded:
 *                       type: boolean
 *                       example: true
 *             examples:
 *               loginSuccess:
 *                 value:
 *                   success: true
 *                   code: LOGIN_SUCCESS
 *                   message: Student login successful
 *                   data:
 *                     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     is_onboarded: true
 *               onboardingRequired:
 *                 value:
 *                   success: true
 *                   code: ONBOARDING_REQUIRED
 *                   message: Onboarding required to complete your profile
 *                   data:
 *                     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     is_onboarded: false
 *       "400":
 *         description: Missing Google credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingGoogleCredentials:
 *                 value:
 *                   success: false
 *                   code: MISSING_GOOGLE_CREDENTIALS
 *                   message: Missing Google user info.
 *       "401":
 *         description: Unauthorized - token or time errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tokenTimeError:
 *                 value:
 *                   success: false
 *                   code: AUTH_TOKEN_TIME_ERROR
 *                   message: Google token rejected due to time mismatch. Please check your device or server clock. / No token provided.
 *               noTokenError:
 *                 value:
 *                   success: false
 *                   code: AUTH_NO_TOKEN
 *                   message: No token provided.
 *       "403":
 *         description: Forbidden - unauthorized email domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorizedDomain:
 *                 value:
 *                   success: false
 *                   code: AUTH_UNAUTHORIZED_DOMAIN
 *                   message: "Unauthorized domain: undefined, Umak email required"
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
router.post("/student/login", googleAuthMiddleware, asyncHandler(loginController.handleStudentLogin.bind(loginController)));

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
 * /admin/login:
 *   post:
 *     summary: Admin login using personal credentials (email, password)
 *     description: |
 *       Handles admin login using email and password.  
 *       - Any existing refresh token for the student will be invalidated and replaced.  
 *       - Returns a JWT access token and refresh token pair for secure session management.
 *     tags:
 *       - Admin Authentication
 *     security: 
 *       - bearerAuth: [] 
 *     requestBody:
 *       required: true
 *       description: Google-authenticated user information injected by middleware
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admin_email
 *               - admin_password
 *             properties:
 *               admin_email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.edu
 *               admin_password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       "200":
 *         description: Login successful or onboarding required
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
 *                   example: LOGIN_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: JWT access token for authenticated requests
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                     refresh_token:
 *                       type: string
 *                       description: Refresh token for session management
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *             examples:
 *               loginSuccess:
 *                 value:
 *                   success: true
 *                   code: LOGIN_SUCCESS
 *                   message: Admin login successful
 *                   data:
 *                     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *       "400":
 *         description: Missing Admin credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAdminCredentials:
 *                 value:
 *                   success: false
 *                   code: MISSING_Admin_CREDENTIALS
 *                   message: Missing admin user info.
 *       "401":
 *         description: Unauthorized - token or time errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tokenTimeError:
 *                 value:
 *                   success: false
 *                   code: AUTH_TOKEN_TIME_ERROR
 *                   message: Google token rejected due to time mismatch. Please check your device or server clock. / No token provided.
 *               noTokenError:
 *                 value:
 *                   success: false
 *                   code: AUTH_NO_TOKEN
 *                   message: No token provided.
 *       "403":
 *         description: Forbidden - unauthorized email domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorizedDomain:
 *                 value:
 *                   success: false
 *                   code: AUTH_UNAUTHORIZED_DOMAIN
 *                   message: "Unauthorized domain: undefined, Umak email required"
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
router.post("/admin/login", asyncHandler(loginController.handleAdminLogin.bind(loginController)));

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
 * /counselor/login:
 *   post:
 *     summary: Counselor login using personal credentials (email, password)
 *     description: |
 *       Handles counselor login using email and password.  
 *       - Any existing refresh token for the student will be invalidated and replaced.  
 *       - Returns a JWT access token and refresh token pair for secure session management.
 *     tags:
 *       - Counselor Authentication
 *     security: 
 *       - bearerAuth: [] 
 *     requestBody:
 *       required: true
 *       description: Google-authenticated user information injected by middleware
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - counselor_email
 *               - counselor_password
 *             properties:
 *               counselor_email:
 *                 type: string
 *                 format: email
 *                 example: counselor@example.edu
 *               counselor_password:
 *                 type: string
 *                 example: counselor123
 *     responses:
 *       "200":
 *         description: Login successful or onboarding required
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
 *                   example: LOGIN_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Counselor login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: JWT access token for authenticated requests
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                     refresh_token:
 *                       type: string
 *                       description: Refresh token for session management
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *             examples:
 *               loginSuccess:
 *                 value:
 *                   success: true
 *                   code: LOGIN_SUCCESS
 *                   message: Counselor login successful
 *                   data:
 *                     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *       "400":
 *         description: Missing Admin credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAdminCredentials:
 *                 value:
 *                   success: false
 *                   code: MISSING_Admin_CREDENTIALS
 *                   message: Missing admin user info.
 *       "401":
 *         description: Unauthorized - token or time errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tokenTimeError:
 *                 value:
 *                   success: false
 *                   code: AUTH_TOKEN_TIME_ERROR
 *                   message: Google token rejected due to time mismatch. Please check your device or server clock. / No token provided.
 *               noTokenError:
 *                 value:
 *                   success: false
 *                   code: AUTH_NO_TOKEN
 *                   message: No token provided.
 *       "403":
 *         description: Forbidden - unauthorized email domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorizedDomain:
 *                 value:
 *                   success: false
 *                   code: AUTH_UNAUTHORIZED_DOMAIN
 *                   message: "Unauthorized domain: undefined, Umak email required"
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
router.post("/counselor/login", asyncHandler(loginController.handleCounselorLogin.bind(loginController)));

export default router;