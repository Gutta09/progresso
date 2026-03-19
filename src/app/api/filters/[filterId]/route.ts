import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { SavedFilter } from "@/models/SavedFilter";
import mongoose from "mongoose";

// GET: Get a specific filter
export async function GET(
  req: Request,
  { params }: { params: Promise<{ filterId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { filterId } = await params;

    const filter = await SavedFilter.findOne({
      _id: filterId,
      userId: session.userId,
    });

    if (!filter) {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(filter);
  } catch (error) {
    console.error("Error fetching filter:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter" },
      { status: 500 }
    );
  }
}

// PUT: Update a filter
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ filterId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { filterId } = await params;

    const { name, criteria, isDefault } = await req.json();

    // Verify filter exists and belongs to user
    const filter = await SavedFilter.findOne({
      _id: filterId,
      userId: session.userId,
    });

    if (!filter) {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await SavedFilter.updateMany(
        { userId: session.userId, isDefault: true, _id: { $ne: filterId } },
        { isDefault: false }
      );
    }

    if (name) filter.name = name;
    if (criteria) filter.criteria = criteria;
    if (isDefault !== undefined) filter.isDefault = isDefault;

    await filter.save();

    return NextResponse.json(filter);
  } catch (error) {
    console.error("Error updating filter:", error);
    return NextResponse.json(
      { error: "Failed to update filter" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a filter
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ filterId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { filterId } = await params;

    const filter = await SavedFilter.findOneAndDelete({
      _id: filterId,
      userId: session.userId,
    });

    if (!filter) {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Filter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting filter:", error);
    return NextResponse.json(
      { error: "Failed to delete filter" },
      { status: 500 }
    );
  }
}
