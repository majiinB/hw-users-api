import express from 'express'
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { UserController } from '../controllers/user.controller.js';
import { UserService } from '../services/user.service.js';
import { StudentClassificationRepository } from '../repository/studentClassification.repository.js';
import { heronAuthMiddleware } from '../middlewares/heronAuth.middleware..js';
import { AdminRepository } from '../repository/admin.repository.js';
import { CounselorRepository } from '../repository/counselor.repository.js';

const router = express.Router();
const studentClassificationRepository = new StudentClassificationRepository();
const adminRepository = new AdminRepository();
const counselorRepository = new CounselorRepository();
const userService = new UserService(studentClassificationRepository, adminRepository, counselorRepository);
const userController = new UserController(userService);

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
 * /students:
 *   get:
 *     summary: Fetch all students with classifications
 *     description: |
 *       Retrieves a paginated list of students with their most recent classification records.
 *       - **Counselors**: Can only see students from their assigned department
 *       - **Admins/Super Admins**: Can see students from all departments
 *       - Supports filtering by classification type, flagged status, and department
 *       - Uses cursor-based pagination for efficient data retrieval
 *       - Email addresses are anonymized (e.g., a****r@umak.edu.ph)
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classification
 *         schema:
 *           type: string
 *           enum: [Excelling, Thriving, Struggling, InCrisis]
 *         description: Filter students by classification type
 *         example: Struggling
 *       - in: query
 *         name: isFlagged
 *         schema:
 *           type: boolean
 *         description: Filter students by flagged status
 *         example: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of records to return
 *         example: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Classification ID of the last item from the previous page (for pagination)
 *         example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *     responses:
 *       "200":
 *         description: Students fetched successfully
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
 *                   example: FETCHED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Students fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     classifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           classification_id:
 *                             type: string
 *                             format: uuid
 *                             example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                           student_id:
 *                             type: string
 *                             format: uuid
 *                             example: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                           classification:
 *                             type: string
 *                             enum: [Excelling, Thriving, Struggling, In-crisis]
 *                             example: Struggling
 *                           is_flagged:
 *                             type: boolean
 *                             example: true
 *                           classified_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-21T12:08:11.853Z
 *                           email:
 *                             type: string
 *                             description: Anonymized email address
 *                             example: j****e@umak.edu.ph
 *                           department_name:
 *                             type: string
 *                             example: Computer Science
 *                     hasMore:
 *                       type: boolean
 *                       description: Indicates if there are more records available
 *                       example: true
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       description: Classification ID to use for fetching the next page
 *                       example: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Students fetched successfully.
 *                   data:
 *                     classifications:
 *                       - classification_id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                         student_id: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                         classification: Struggling
 *                         is_flagged: true
 *                         classified_at: 2025-10-21T12:08:11.853Z
 *                         email: j****e@umak.edu.ph
 *                         department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       - classification_id: 9d6e4a2c-5678-1234-90ab-cdef87654321
 *                         student_id: 4f8b3c7d-9876-5432-10ba-fedc12345678
 *                         classification: Excelling
 *                         is_flagged: false
 *                         classified_at: 2025-10-20T08:30:00.000Z
 *                         email: j****h@umak.edu.ph
 *                         department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                     hasMore: true
 *                     nextCursor: 9d6e4a2c-5678-1234-90ab-cdef87654321
 *       "400":
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingRole:
 *                 value:
 *                   success: false
 *                   code: MISSING_USER_INFO
 *                   message: User role is required.
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 value:
 *                   success: false
 *                   code: UNAUTHORIZED
 *                   message: Invalid or missing authentication token.
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
 *                   message: Failed to fetch students
 */
router.get('/students', heronAuthMiddleware, asyncHandler(userController.handleFetchingAllStudents.bind(userController)));

router.post('/students/:studentId', heronAuthMiddleware, asyncHandler(userController.handleFetchingSpecificStudent.bind(userController)));
export default router;