import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await (supabase as any).storage
        .from("avatars")
        .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: true,
        });

    if (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = (supabase as any).storage
        .from("avatars")
        .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
}
