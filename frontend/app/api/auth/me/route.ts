import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = JSON.parse(atob(payload));

    return NextResponse.json({
      user: {
        id: decoded.user_id || decoded.userId || "",
        type: "user",
        email: decoded.email || "",
      },
      token,
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
