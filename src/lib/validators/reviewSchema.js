import { z } from "zod";

/**
 * Code review request validation schema
 * Validates code snippet and programming language
 */
export const reviewSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.string().min(1, "Programming language is required"),
});
