import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { Activity } from "@/models/Activity";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import mongoose from "mongoose";

// POST: Log an activity
export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;

    const { action, fieldName, oldValue, newValue, description } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
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

    // Create activity record
    const activity = await Activity.create({
      taskId,
      userId: session.userId,
      action,
      fieldName,
      oldValue,
      newValue,
      description,
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}

// GET: Get activity timeline for a task
export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;

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

    // Fetch activities with user details
    const activities = await Activity.find({ taskId })
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
