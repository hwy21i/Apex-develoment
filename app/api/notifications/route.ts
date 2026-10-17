import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Notification } from "@/models/Notification";
import { requireAuth } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

    const filter: Record<string, unknown> = {
      userId: user.id,
    };

    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({
        userId: user.id,
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve notifications";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    await connectToDatabase();

    if (markAllAsRead) {
      await Notification.updateMany(
        {
          userId: user.id,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid notificationId" },
        { status: 400 }
      );
    }

    const updated = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: user.id,
      },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update notification";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
