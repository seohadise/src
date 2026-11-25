import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getUser } from "@/lib/helpers";
import { sendWithdrawalNotificationToAdmin } from "@/lib/sms-service";

// API برای ایجاد درخواست برداشت توسط کاربران عادی
export async function POST(request) {
    try {
        await connectDB();
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد حساب کاربری خود شوید" },
                { status: 401 }
            );
        }

        if (user?.isBanned) {
            return NextResponse.json(
                { success: false, message: "حساب کاربری شما مسدود شده است" },
                { status: 403 }
            );
        }

        if (!user?.isVerified) {
            return NextResponse.json(
                { success: false, message: "لطفا ابتدا حساب کاربری خود را تایید کنید" },
                { status: 403 }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }
        const { amount, cardNumber, shebaNumber, accountNumber, ownerName } = body;

        console.log("[Withdrawal POST] Body received:", { amount, cardNumber: cardNumber ? "***" + String(cardNumber).slice(-4) : null, ownerName });

        // اطلاعات بانکی - ابتدا از body، سپس از پروفایل کاربر
        const profileBankInfo = user.bankInfo || {};
        const finalBankInfo = {
            cardNumber: cardNumber || profileBankInfo.cardNumber,
            shebaNumber: shebaNumber || profileBankInfo.shebaNumber,
            accountNumber: accountNumber || profileBankInfo.accountNumber,
            ownerName: ownerName || profileBankInfo.ownerName,
        };

        console.log("[Withdrawal POST] finalBankInfo.cardNumber exists:", !!finalBankInfo.cardNumber, "ownerName exists:", !!finalBankInfo.ownerName);

        // برای کاربران عادی فقط شماره کارت و نام صاحب حساب الزامی است
        if (!finalBankInfo.cardNumber || !finalBankInfo.ownerName) {
            console.log("[Withdrawal POST] 400: missing card or owner");
            return NextResponse.json({
                success: false,
                message: "شماره کارت و نام صاحب کارت الزامی است",
            }, { status: 400 });
        }

        // اعتبارسنجی شماره کارت (16 رقم)
        const cleanCard = String(finalBankInfo.cardNumber).replace(/\s|-/g, "");
        console.log("[Withdrawal POST] cleanCard length:", cleanCard.length);
        if (!/^\d{16}$/.test(cleanCard)) {
            console.log("[Withdrawal POST] 400: invalid card number:", cleanCard);
            return NextResponse.json({
                success: false,
                message: "شماره کارت باید 16 رقمی باشد",
            }, { status: 400 });
        }
        finalBankInfo.cardNumber = cleanCard;

        // پر کردن مقادیر الزامی schema با placeholder در صورت نبود
        if (!finalBankInfo.shebaNumber) finalBankInfo.shebaNumber = "-";
        if (!finalBankInfo.accountNumber) finalBankInfo.accountNumber = "-";

        const userBalance = user.wallet?.balance || 0;
        console.log("[Withdrawal POST] userBalance:", userBalance, "requestAmount from body:", amount);

        if (userBalance < 1000) {
            console.log("[Withdrawal POST] 400: balance too low:", userBalance);
            return NextResponse.json({
                success: false,
                message: "حداقل میزان برداشت 1 هزار تومان میباشد",
            }, { status: 400 });
        }

        const requestAmount = Number(amount) || userBalance;

        if (requestAmount < 1000) {
            console.log("[Withdrawal POST] 400: requestAmount too low:", requestAmount);
            return NextResponse.json({
                success: false,
                message: "حداقل میزان برداشت 1 هزار تومان میباشد",
            }, { status: 400 });
        }

        if (requestAmount > userBalance) {
            console.log("[Withdrawal POST] 400: requestAmount > balance:", requestAmount, ">", userBalance);
            return NextResponse.json({
                success: false,
                message: "مبلغ درخواستی بیشتر از موجودی شما است",
            }, { status: 400 });
        }

        // بررسی درخواست‌های در انتظار - فقط pending بلاک می‌کند
        const pendingRequest = await WithdrawalRequest.findOne({
            user: user._id,
            status: "pending",
        });

        console.log("[Withdrawal POST] User ID:", user._id);
        console.log("[Withdrawal POST] Pending request found:", pendingRequest);

        if (pendingRequest) {
            return NextResponse.json({
                success: false,
                message: "شما یک درخواست برداشت در انتظار دارید",
            }, { status: 400 });
        }

        // ایجاد درخواست برداشت جدید
        const withdrawalRequest = await WithdrawalRequest.create({
            user: user._id,
            amount: requestAmount,
            bankInfo: finalBankInfo,
            status: "pending",
        });

        // کسر فوری موجودی از کیف پول کاربر (hold)
        await User.findByIdAndUpdate(user._id, {
            $inc: { "wallet.balance": -requestAmount },
        });

        // ایجاد تراکنش در حالت pending - تا تایید نهایی توسط ادمین
        await Transaction.create({
            user: user._id,
            amount: requestAmount,
            type: "withdraw",
            description: `درخواست برداشت وجه - ${requestAmount.toLocaleString("fa-IR")} تومان`,
            status: "pending",
            relatedModel: "WithdrawalRequest",
            relatedId: withdrawalRequest._id,
        });

        // اطلاع‌رسانی به مدیر از طریق پیامک
        sendWithdrawalNotificationToAdmin(
            user.fullName || user.username || "کاربر",
            requestAmount,
            user.type
        ).catch((err) => console.error("[withdrawal] SMS notification failed:", err.message));

        return NextResponse.json({
            success: true,
            message: "درخواست برداشت ثبت شد و مبلغ از کیف پول شما کسر گردید. پس از واریز توسط مدیر تایید نهایی خواهد شد.",
            data: withdrawalRequest,
        });
    } catch (error) {
        console.error("خطا در ایجاد درخواست برداشت:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "خطا در ایجاد درخواست برداشت",
        }, { status: 500 });
    }
}

// API برای لغو درخواست برداشت کاربر
export async function DELETE(request) {
    try {
        await connectDB();
        const user = await getUser();

        if (!user || user?.isBanned || !user?.isVerified) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیر مجاز" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const withdrawalId = searchParams.get("id");

        if (!withdrawalId) {
            return NextResponse.json(
                { success: false, message: "شناسه درخواست الزامی است" },
                { status: 400 }
            );
        }

        // پیدا کردن درخواست برداشت
        const withdrawal = await WithdrawalRequest.findOne({
            _id: withdrawalId,
            user: user._id,
        });

        if (!withdrawal) {
            return NextResponse.json(
                { success: false, message: "درخواست برداشت یافت نشد" },
                { status: 404 }
            );
        }

        // فقط درخواست‌های pending یا approved قابل لغو هستند
        if (withdrawal.status !== "pending" && withdrawal.status !== "approved") {
            return NextResponse.json(
                { success: false, message: "فقط درخواست‌های در انتظار یا تایید شده قابل لغو هستند" },
                { status: 400 }
            );
        }

        // بازگشت مبلغ به کیف پول کاربر
        await User.findByIdAndUpdate(user._id, {
            $inc: { "wallet.balance": withdrawal.amount },
        });

        // علامت‌گذاری تراکنش‌های pending مرتبط به عنوان failed
        await Transaction.updateMany(
            {
                relatedModel: "WithdrawalRequest",
                relatedId: withdrawal._id,
                status: "pending",
            },
            { $set: { status: "failed" } }
        );

        // ثبت تراکنش بازگشت وجه
        await Transaction.create({
            user: user._id,
            amount: withdrawal.amount,
            type: "refund",
            description: "لغو درخواست برداشت توسط کاربر",
            status: "completed",
            relatedModel: "WithdrawalRequest",
            relatedId: withdrawal._id,
        });

        // حذف درخواست برداشت
        await WithdrawalRequest.findByIdAndDelete(withdrawalId);

        return NextResponse.json({
            success: true,
            message: "درخواست برداشت با موفقیت لغو شد و مبلغ به کیف پول شما بازگشت",
        });
    } catch (error) {
        console.error("خطا در لغو درخواست برداشت:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "خطا در لغو درخواست برداشت",
            },
            { status: 500 }
        );
    }
}

// API برای دریافت درخواست‌های برداشت کاربر
export async function GET(request) {
    try {
        await connectDB();
        const user = await getUser();

        console.log("[Withdrawals GET] User ID:", user._id);

        if (!user || user?.isBanned || !user?.isVerified) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیر مجاز" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const status = searchParams.get("status");

        console.log("[Withdrawals GET] Status filter:", status);

        const filter = { user: user._id };
        if (status && status !== "all") {
            filter.status = status;
        }

        console.log("[Withdrawals GET] Filter:", filter);

        const skip = (page - 1) * limit;

        const withdrawals = await WithdrawalRequest.find(filter)
            .populate("processedBy", "fullName email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalWithdrawals = await WithdrawalRequest.countDocuments(filter);

        console.log("[Withdrawals GET] Found withdrawals:", withdrawals.length);
        console.log("[Withdrawals GET] Total count:", totalWithdrawals);

        return NextResponse.json({
            success: true,
            data: {
                withdrawals,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalWithdrawals / limit),
                    totalItems: totalWithdrawals,
                    itemsPerPage: limit,
                },
            },
            message: "درخواست‌های برداشت با موفقیت دریافت شد",
        });
    } catch (error) {
        console.error("خطا در دریافت درخواست‌های برداشت:", error);
        return NextResponse.json({
            success: false,
            message: "خطا در دریافت درخواست‌های برداشت",
        }, { status: 500 });
    }
}
