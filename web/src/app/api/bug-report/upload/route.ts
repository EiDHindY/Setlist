import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: "Missing Cloudinary config" }, { status: 500 });
    }

    // Use the unsigned upload preset — no API key/secret needed
    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file);
    cloudinaryForm.append("upload_preset", uploadPreset);
    cloudinaryForm.append("folder", "bug_reports");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudinaryForm }
    );

    const result = await res.json();

    if (!res.ok || !result.secure_url) {
      console.error("Cloudinary error:", result);
      return NextResponse.json({ error: result?.error?.message ?? "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
