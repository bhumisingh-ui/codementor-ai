import { z } from "zod";

/**
 * GitHub repository analysis request validation schema
 * Validates GitHub repository URL format
 */
export const githubRepoSchema = z.object({
  repoUrl: z
    .string()
    .url("Invalid URL format")
    .refine((url) => url.includes("github.com"), "Must be a valid GitHub repository URL"),
});
