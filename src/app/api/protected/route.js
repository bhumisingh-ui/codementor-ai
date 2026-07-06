import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { handleError } from "@/lib/errorHandler";

export async function GET() {
  // ✅ FIX: await cookies()
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      message: "Protected data accessed",
      user: decoded,
    });
  } catch (error) {
    const errorResponse = handleError(error, { route: "/api/protected" });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
