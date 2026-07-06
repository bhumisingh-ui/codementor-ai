/**
 * Validate request data against a Zod schema
 * Returns validation result or null if valid
 *
 * Usage:
 *   const validationError = await validate(data, schema);
 *   if (validationError) return Response.json(validationError, { status: 400 });
 */
export async function validate(data, schema) {
  try {
    schema.parse(data);
    return null; // Valid
  } catch (error) {
    // Extract Zod validation errors (using 'issues' for newer Zod versions)
    const errors = error.issues.map((issue) => ({
      field: issue.path.join(".") || issue.code,
      message: issue.message,
    }));

    return {
      success: false,
      message: "Invalid input",
      errors,
    };
  }
}
