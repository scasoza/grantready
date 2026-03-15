import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { email, centerName } = await request.json();

    if (!email || !centerName) {
      return NextResponse.json(
        { error: "Email and center name are required" },
        { status: 400 }
      );
    }

    const signup = {
      email,
      centerName,
      timestamp: new Date().toISOString(),
    };

    // For MVP: append to a JSON file. Replace with Supabase later.
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "signups.json");

    await fs.mkdir(dataDir, { recursive: true });

    let signups = [];
    try {
      const existing = await fs.readFile(filePath, "utf-8");
      signups = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }

    signups.push(signup);
    await fs.writeFile(filePath, JSON.stringify(signups, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
