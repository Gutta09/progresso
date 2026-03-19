import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { SavedFilter } from "@/models/SavedFilter";
import mongoose from "mongoose";

// POST: Create a saved filter
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await requireSession();

    const { name, criteria, isDefault } = await req.json();

    if (!name || !criteria) {
      return NextResponse.json(
        { error: "name and criteria are required" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Filter name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await SavedFilter.updateMany(
        { userId: session.userId, isDefault: true },
        { isDefault: false }
      );
    }

    const filter = await SavedFilter.create({
      userId: session.userId,
      name,
      criteria,
      isDefault: isDefault ?? false,
    });

    return NextResponse.json(filter);
  } catch (error) {
    console.error("Error creating filter:", error);
    return NextResponse.json(
      { error: "Failed to create filter" },
      { status: 500 }
    );
  }
}

// GET: Get all saved filters for user
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const session = await requireSession();

    const filters = await SavedFilter.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      filters,
      count: filters.length,
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
