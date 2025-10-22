import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import { AppError } from "../types/appError.type.js";
import { verifyToken } from "../utils/jwt.util.js";
import type { AccessTokenClaims } from "../types/accessTokenClaim.type.js";

export async function heronAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader : string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        401, 
        "AUTH_NO_TOKEN", 
        "No token provided", 
        true
      );
    }

    const token: string = authHeader.split(" ")[1];
    
    const payload : AccessTokenClaims = await verifyToken(token);
    
    if(!payload.email || !payload.name || !payload.sub || !payload.role) {
      throw new AppError(
        401,
        "AUTH_INVALID_TOKEN",
        "Token is missing required fields",
        true
      );
    }

    if(payload.role !== "counselor" && payload.role !== "admin" && payload.role !== "super_admin") {
      throw new AppError(
        403,
        "AUTH_FORBIDDEN",
        "The user does not have permission to access this resource",
        true
      );
    }

    // Attach user info to request object
    req.user = {
      email: payload.email!,
      name: payload.name!,
      sub: payload.sub!,
      role: payload.role!,
      college_department: payload.role === "counselor" ? payload.college_department! : undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
}