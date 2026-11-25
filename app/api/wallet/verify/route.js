import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Payment from "@/models/Payment";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export async function GET(request) {
    try {
        console.log("Wallet verify called");
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const authority = searchParams.get("Authority");
        const status = searchParams.get("Status");

        console.log("Authority:", authority, "Status:", status);

        if (!authority) {
            console.log("No authority found");
            return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?reason=no_authority`);
        }

        // Find payment by authority
        console.log("Finding payment with authority:", authority);
        const payment = await Payment.findOne({ authority }).populate("user");
        console.log("Payment found:", payment ? "Yes" : "No");

        if (!payment) {
            return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?reason=payment_not_found`);
        }

        // Check if payment was cancelled
        if (status !== "OK") {
            payment.status = "failed";
            await payment.save();
            return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?reason=cancelled`);
        }

        // Check if already verified
        if (payment.status === "paid") {
            return NextResponse.redirect(`${process.env.BASE_URL}/dashboard/user/wallet?success=already_verified`);
        }

        // Verify payment with ZarinPal
        console.log("Verifying with ZarinPal...");
        const verifyRequest = {
            merchant_id: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
            amount: payment.amount * 10, // تبدیل تومان به ریال
            authority: authority,
        };

        console.log("ZarinPal request:", {
            ...verifyRequest,
            merchant_id: verifyRequest.merchant_id ? "***" : "MISSING"
        });

        const verifyResponse = await fetch(
            "https://api.zarinpal.com/pg/v4/payment/verify.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(verifyRequest),
            }
        );

        const verifyData = await verifyResponse.json();
        console.log("ZarinPal response:", verifyData);

        if (verifyData.data?.code === 100) {
            // Payment successful
            payment.status = "paid";
            payment.trackingCode = verifyData.data.ref_id;
            await payment.save();

            // Update user wallet balance
            const user = await User.findById(payment.user._id || payment.user);
            
            if (user) {
                // Add amount to wallet
                user.wallet.balance = (user.wallet.balance || 0) + payment.amount;
                
                // Create transaction record
                const transaction = await Transaction.create({
                    user: user._id,
                    type: "income",
                    amount: payment.amount,
                    description: `شارژ کیف پول - کد پیگیری: ${verifyData.data.ref_id}`,
                    relatedId: payment._id,
                    relatedType: "Payment",
                    status: "completed",
                });

                // Add transaction to user's wallet
                if (!user.wallet.transactions) {
                    user.wallet.transactions = [];
                }
                user.wallet.transactions.push(transaction._id);
                
                await user.save();

                return NextResponse.redirect(
                    `${process.env.BASE_URL}/dashboard/user/wallet?success=true&amount=${payment.amount}&ref_id=${verifyData.data.ref_id}`
                );
            } else {
                return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?reason=user_not_found`);
            }
        } else if (verifyData.data?.code === 101) {
            // Already verified
            return NextResponse.redirect(`${process.env.BASE_URL}/dashboard/user/wallet?success=already_verified`);
        } else {
            // Verification failed
            payment.status = "failed";
            await payment.save();
            return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?reason=verification_failed`);
        }
    } catch (error) {
        console.error("Error in wallet verify:", error);
        return NextResponse.redirect(`${process.env.BASE_URL}/payment/failed?reason=server_error`);
    }
}
