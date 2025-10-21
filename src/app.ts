/**
 * Heron Wellnest Authentication API
 *
 * @file app.ts
 * @description Sets up and configures the Express application instance for the 
 * Heron Wellnest Authentication API. This file defines middleware, routes, 
 * and application-level settings. It does not start the server directly—`index.ts`
 * handles bootstrapping and listening on the port.
 *
 * Routes:
 * - GET /health: A simple health check endpoint that returns a status of 'ok'.
 *
 * Middleware:
 * - express.json(): Parses incoming request bodies in JSON format.
 * - CORS policy: Applies Cross-Origin Resource Sharing rules for valid sources.
 *
 * Usage:
 * - Imported by `index.ts` to start the server.
 *
 * @author Arthur M. Artugue
 * @created 2025-08-16
 * @updated 2025-10-21
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import {corsOptions} from './config/cors.config.js'; 
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { googleAuthMiddleware } from './middlewares/googleAuth.middleware.js';
import type { AuthenticatedRequest } from './interface/authRequest.interface.js';
import loginRoute from './routes/login.route.js';
import { env } from './config/env.config.js';
import fs from 'fs';

const app : express.Express = express();
const isTS = fs.existsSync('./src/routes');

// --- Swagger options ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Heron Wellnest Users API',
      version: '1.0.0',
      description: "Heron Wellnest Users API provides secure endpoints for managing users or students withing the system. This API requires administrative privileges to access its resources.",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1/users`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [isTS ? './src/routes/**/*.ts' : './dist/routes/**/*.{js,ts}'], // 👈 path to your route files with @openapi JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(cors(corsOptions));
app.use(express.json()); 
app.use(loggerMiddleware); // Custom logger middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1/auth', loginRoute);

// This is a health check route
app.get('/api/v1/auth/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/dev/v1/test', googleAuthMiddleware, async (_req : AuthenticatedRequest, res) => {
  // TEST ROUTE - REMOVE IN PRODUCTION
  res.status(200).json({ status: 'ok', user: _req.user });
});
  
app.use(errorMiddleware); // Custom error handling middleware

export default app;