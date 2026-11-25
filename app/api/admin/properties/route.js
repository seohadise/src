import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Property from "@/models/Property";
import { getUser } from "@/lib/helpers";
import { getPolicyByKey, DEFAULT_CANCELLATION_POLICY } from "@/constants/cancellation-policies";

const normalizeCancellationRules = (property) => {
    if (typeof property.cancellationRules === 'string' || !property.cancellationRules?.penalties) {
        const policyKey = property.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
        const policy = getPolicyByKey(policyKey);
        property.cancellationRules = {
            penalties: policy.penalties.map((penalty) => ({ ...penalty })),
        };
    }
    return property;
};

export async function GET(request) {
    try {
        await connectDB();

        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;

        const filter = {};
        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const properties = await Property.find(filter)
            .populate(
                "owner",
                "fullName email number type isVerified identityInfo.nationalId identityInfo.nationalIdImage"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Property.countDocuments(filter);

        // Normalize cancellation rules for legacy properties
        const normalizedProperties = properties.map(prop => normalizeCancellationRules(prop));

        return NextResponse.json({
            success: true,
            data: normalizedProperties,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json(
            { success: false, message: "خطا در دریافت املاک" },
            { status: 500 }
        );
    }
}
