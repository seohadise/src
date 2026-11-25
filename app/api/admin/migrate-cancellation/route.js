import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Property from "@/models/Property";
import { getUser } from "@/lib/helpers";
import { getPolicyByKey, DEFAULT_CANCELLATION_POLICY } from "@/constants/cancellation-policies";

export async function POST(request) {
    try {
        await connectDB();

        const user = await getUser();
        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        console.log("Starting migration...");

        // Find all properties with string cancellationRules
        const properties = await Property.find({
            $or: [
                { cancellationRules: { $type: "string" } },
                { "cancellationRules.penalties": { $exists: false } }
            ]
        });

        console.log(`Found ${properties.length} properties to migrate`);

        let updated = 0;
        const errors = [];

        for (const property of properties) {
            try {
                const policyKey = property.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
                const policy = getPolicyByKey(policyKey);

                property.cancellationRules = {
                    penalties: policy.penalties.map((penalty) => ({ ...penalty })),
                };

                await property.save();
                updated++;
                console.log(`Updated property ${property._id} (${updated}/${properties.length})`);
            } catch (error) {
                errors.push({
                    propertyId: property._id,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migration completed. Updated ${updated} properties.`,
            data: {
                total: properties.length,
                updated,
                errors: errors.length,
                errorDetails: errors
            }
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
