import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { Task } from "@/models/Task";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";

const UPLOAD_DIR = "public/uploads";

// POST: Upload an attachment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type (whitelist common safe types)
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({
      _id: taskId,
      userId: session.userId,
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Ensure upload directory exists
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
      console.error("Failed to create upload directory:", err);
    }

    // Generate unique filename
    const fileId = uuidv4();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file
    const buffer = await file.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));

    // Add attachment metadata to task
    const attachment = {
      id: fileId,
      filename: file.name,
      url: `/uploads/${filename}`,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: new mongoose.Types.ObjectId(session.userId),
    };

    task.attachments = task.attachments || [];
    task.attachments.push(attachment as any);
    await task.save();

    return NextResponse.json({
      attachment,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET: Get all attachments for a task
export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;

    const task = await Task.findOne({
      _id: taskId,
      userId: session.userId,
    }).populate("attachments.uploadedBy", "username");

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      attachments: task.attachments || [],
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an attachment
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;

    const { attachmentId } = await req.json();

    if (!attachmentId) {
      return NextResponse.json(
        { error: "attachmentId is required" },
        { status: 400 }
      );
    }

    const task = await Task.findOne({
      _id: taskId,
      userId: session.userId,
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Find the attachment to delete
    const attachment = task.attachments?.find(
      (a: any) => a.id === attachmentId
    );

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filename = attachment.url.split("/").pop();
      const filepath = path.join(UPLOAD_DIR, filename);
      await fs.unlink(filepath);
    } catch (err) {
      console.warn("Failed to delete file from filesystem:", err);
      // Continue even if file deletion fails
    }

    // Remove attachment from task
    task.attachments = task.attachments.filter(
      (a: any) => a.id !== attachmentId
    );
    await task.save();

    return NextResponse.json({
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
