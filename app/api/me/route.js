import { getUser } from "@/lib/helpers";

export const GET = async () => {
    const user = await getUser();

    if (!user) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // برای کاربران تایید نشده یا مسدود شده، اطلاعات محدود برمی‌گردانیم
    if (!user.isVerified || user?.isBanned) {
        return Response.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            isVerified: user.isVerified,
            isBanned: user.isBanned,
            canComment: false, // نمی‌تواند نظر بگذارد
        });
    }

    return Response.json({
        ...user.toObject(),
        canComment: true, // می‌تواند نظر بگذارد
    });
};
