import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gateways = [
      {
        id: "zarinpal",
        name: "زرین‌پال",
        description: "درگاه پرداخت امن زرین‌پال",
        logo: "https://cdn.zarinpal.com/templates/zarinpal/assets/img/logo.svg",
        isActive: true,
        supportedMethods: ["card", "wallet", "internet_banking"],
        minAmount: 1000,
        maxAmount: 50000000,
        commission: 0,
        merchantId: process.env.ZARINPAL_MERCHANT_ID || "aaaaaaaaaa",
        quickPayLink: "https://zarinp.al/tripgood.ir"
      }
    ];

    return NextResponse.json({
      success: true,
      data: gateways,
      message: "لیست درگاه‌های پرداخت دریافت شد"
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت لیست درگاه‌های پرداخت",
        error: error.message
      },
      { status: 500 }
    );
  }
} 