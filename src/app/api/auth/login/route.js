import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectDB from "@/lib/db";
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials", status: 401 },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username }, // we did this to have username available in the token for Navbar
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    const errorResponse = handleError(error, { route: "/api/auth/login" });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
