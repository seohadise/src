import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(request, { params }) {
  try {
    const path = params.path;
    const filePath = join(process.cwd(), "uploads", ...path);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = path[path.length - 1].match(/\.\w+$/)?.[0]?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Serve upload error:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
