import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/db";
import { handleError } from "@/lib/errorHandler";
import { signupSchema } from "@/lib/validators/signupSchema";
import { validate } from "@/lib/validators/validate";

export async function POST(req) {
  try {
    const data = await req.json();

    // Validate request input
    const validationError = await validate(data, signupSchema);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    await connectDB();
    const { username, email, password } = data;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists", status: 409 },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = handleError(error, { route: "/api/auth/signup" });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
