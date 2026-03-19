import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { Task } from "@/models/Task";
import { ObjectId } from "mongodb";

// Helper function to detect circular dependencies
async function hasCircularDependency(
  taskId: string,
  dependsOnId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (visited.has(dependsOnId)) return true;
  
  visited.add(dependsOnId);
  const task = await Task.findById(dependsOnId);
  
  if (!task || !task.dependsOn || task.dependsOn.length === 0) {
    return false;
  }
  
  for (const depId of task.dependsOn) {
    if (depId.toString() === taskId) return true;
    if (await hasCircularDependency(taskId, depId.toString(), visited)) {
      return true;
    }
  }
  
  return false;
}

// POST: Add a dependency
export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;
    
    const { dependsOnId } = await req.json();
    
    if (!dependsOnId) {
      return NextResponse.json(
        { error: "dependsOnId is required" },
        { status: 400 }
      );
    }
    
    if (taskId === dependsOnId) {
      return NextResponse.json(
        { error: "Task cannot depend on itself" },
        { status: 400 }
      );
    }
    
    // Validate both tasks exist and belong to user
    const [task, dependsOnTask] = await Promise.all([
      Task.findOne({ _id: taskId, userId: session.userId }),
      Task.findOne({ _id: dependsOnId, userId: session.userId }),
    ]);
    
    if (!task || !dependsOnTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    // Check for circular dependency
    const hasCircular = await hasCircularDependency(taskId, dependsOnId);
    if (hasCircular) {
      return NextResponse.json(
        { error: "Adding this dependency would create a circular reference" },
        { status: 400 }
      );
    }
    
    // Check if dependency already exists
    if (task.dependsOn.includes(new ObjectId(dependsOnId))) {
      return NextResponse.json(
        { error: "Dependency already exists" },
        { status: 400 }
      );
    }
    
    // Add dependency
    task.dependsOn.push(new ObjectId(dependsOnId));
    await task.save();
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error adding dependency:", error);
    return NextResponse.json(
      { error: "Failed to add dependency" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a dependency
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireSession();
    const { taskId } = await params;
    
    const { dependsOnId } = await req.json();
    
    if (!dependsOnId) {
      return NextResponse.json(
        { error: "dependsOnId is required" },
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
    
    // Remove dependency
    task.dependsOn = task.dependsOn.filter(
      (dep: any) => dep.toString() !== dependsOnId
    );
    await task.save();
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error removing dependency:", error);
    return NextResponse.json(
      { error: "Failed to remove dependency" },
      { status: 500 }
    );
  }
}

// GET: Get dependencies with details
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
    }).populate("dependsOn", "title status priority dueDate");
    
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      dependencies: task.dependsOn || [],
    });
  } catch (error) {
    console.error("Error fetching dependencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch dependencies" },
      { status: 500 }
    );
  }
}
