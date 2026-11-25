import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import { getUser } from "@/lib/helpers";

export async function POST(request) {
    try {
        await connectDB();
        const user = await getUser();
        
        if (!user) {
            return NextResponse.json(
                { success: false, message: "لطفا وارد شوید" },
                { status: 401 }
            );
        }

        const { amount } = await request.json();

        // Validate amount
        if (!amount || amount < 1000) {
            return NextResponse.json(
                { success: false, message: "حداقل مبلغ شارژ 1,000 تومان است (v2)" },
                { status: 400 }
            );
        }

        if (amount > 100000000) {
            return NextResponse.json(
                { success: false, message: "حداکثر مبلغ شارژ 100,000,000 تومان است" },
                { status: 400 }
            );
        }

        // Generate payment URL (ZarinPal or other gateway)
        const zarinpalRequest = {
            merchant_id: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
            amount: amount * 10, // تبدیل تومان به ریال
            description: `شارژ کیف پول - ${amount.toLocaleString("fa-IR")} تومان`,
            callback_url: `${process.env.BASE_URL}/api/wallet/verify`,
            metadata: {
                mobile: user.number || user.phone || "",
                email: user.email || "",
            },
        };

        const zarinpalResponse = await fetch(
            "https://api.zarinpal.com/pg/v4/payment/request.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(zarinpalRequest),
            }
        );

        const zarinpalData = await zarinpalResponse.json();

        if (zarinpalData.data?.code === 100 && zarinpalData.data?.authority) {
            // Create payment record after getting authority
            const payment = await Payment.create({
                user: user._id,
                authority: zarinpalData.data.authority,
                amount: amount,
                itemType: "wallet",
                description: `شارژ کیف پول - ${amount.toLocaleString("fa-IR")} تومان`,
                status: "pending",
            });

            return NextResponse.json({
                success: true,
                paymentUrl: `https://www.zarinpal.com/pg/StartPay/${zarinpalData.data.authority}`,
                paymentId: payment._id.toString(),
            });
        } else {
            console.error("ZarinPal Error:", zarinpalData);
            
            // Extract error message
            let errorMessage = "خطا در ایجاد درگاه پرداخت";
            if (zarinpalData.errors && zarinpalData.errors.length > 0) {
                errorMessage = zarinpalData.errors.join(", ");
            } else if (zarinpalData.data?.message) {
                errorMessage = zarinpalData.data.message;
            }
            
            return NextResponse.json(
                {
                    success: false,
                    message: errorMessage,
                    details: zarinpalData,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in wallet charge:", error);
        return NextResponse.json(
            { success: false, message: "خطای سرور", error: error.message },
            { status: 500 }
        );
    }
}
