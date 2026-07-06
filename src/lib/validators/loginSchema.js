import { z } from "zod";

/**
 * Login request validation schema
 * Validates email and password fields
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
