import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/db";
import { applyAuthCookie, signAuthToken } from "@/lib/auth";
import { handleError } from "@/lib/errorHandler";
import { loginSchema } from "@/lib/validators/loginSchema";
import { validate } from "@/lib/validators/validate";

export async function POST(req) {
  try {
    const data = await req.json();

    // Validate request input
    const validationError = await validate(data, loginSchema);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    await connectDB();

    const { email, password } = data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials", status: 401 },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "This account uses Google sign-in", status: 401 },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials", status: 401 },
        { status: 401 }
      );
    }

    const token = signAuthToken(user);

    const response = NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

    return applyAuthCookie(response, token);
  } catch (err) {
    const errorResponse = handleError(err, { route: "/api/auth/login" });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
