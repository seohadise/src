import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

function getS3Client() {
  return new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
    endpoint: `https://${process.env.NEXT_PUBLIC_AWS_ENDPOINT}`,
    forcePathStyle: true,
  });
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "";
    const originalName = formData.get("originalName") || file.name;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = originalName.replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF\u200C.\-]/g, "");
    const timestamp = Date.now();
    const key = folder
      ? `${folder}/${timestamp}-${safeName}`
      : `${timestamp}-${safeName}`;

    const bucket = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
    const endpoint = process.env.NEXT_PUBLIC_AWS_ENDPOINT;

    const s3Client = getS3Client();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `https://${endpoint}/${bucket}/${key}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
