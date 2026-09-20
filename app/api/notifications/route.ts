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
      $or: [{ userId: user.id }, { userId: { $exists: false } }],
    };

    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({
        $or: [{ userId: user.id }, { userId: { $exists: false } }],
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve notifications" },
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

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Missing notificationId" },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
