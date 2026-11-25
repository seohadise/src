import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const schema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            default: "",
            trim: true,
        },
        username: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
            minLength: [3, "Username must be at least 3 characters"],
            match: [
                /^[a-z0-9_-]{3,15}$/,
                "Username can only contain letters, numbers, dots, underscores and dashes",
            ],
        },
        number: {
            type: String,
            trim: true,
            unique: true,
            required: [true, "Number is Required"],
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
            match: [
                /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/,
                "Please enter a valid email address",
            ],
        },
        password: {
            type: String,
            trim: true,
            minLength: [8, "Password must be at least 8 characters"],
        },
        avatar: { type: String, default: "" },
        isVerified: { type: Boolean, default: false },
        emailVerifiedAt: { type: Date, default: null },
        otp: { type: String, default: "" },
        verificationExpires: {
            type: Date,
            default: Date.now,
            index: {
                expires: "5m",
                partialFilterExpression: { isVerified: false },
            },
        },
        type: {
            type: String,
            enum: ["property-owner", "bus-owner", "food-owner", "customer"],
            required: [true, "User type is Required"],
        },
        isAdmin: { type: Boolean, default: false },
        isBanned: { type: Boolean, default: false },
        properties: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Property",
            },
        ],
        buses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Bus",
            },
        ],
        foods: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Food",
            },
        ],
        bankInfo: {
            shebaNumber: { type: String, default: "" },
            accountNumber: { type: String, default: "" },
            cardNumber: { type: String, default: "" },
            ownerName: { type: String, default: "" },
        },
        // اطلاعات شناسایی مالک
        identityInfo: {
            nationalId: {
                type: String,
                default: "",
                validate: [
                    {
                        validator: function (v) {
                            // اعتبارسنجی کد ملی ایرانی
                            if (!v) return true; // اختیاری است
                            return /^[0-9]{10}$/.test(v);
                        },
                        message: "کد ملی باید 10 رقم باشد",
                    },
                ],
            },
            nationalIdImage: {
                type: String,
                default: "",
            },
            isIdentityVerified: {
                type: Boolean,
                default: false,
            },
            identityVerifiedAt: {
                type: Date,
                default: null,
            },
            // اطلاعات اضافی برای مالکان
            ownerInfo: {
                firstName: { type: String, default: "" },
                lastName: { type: String, default: "" },
                fatherName: { type: String, default: "" },
                birthDate: { type: Date, default: null },
                birthPlace: { type: String, default: "" },
                address: { type: String, default: "" },
            },
        },
        wallet: {
            balance: { type: Number, default: 0 },
            transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
        },
        payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
        reservations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Reservation",
            },
        ],
        birthDate: { type: Date, default: Date.now },
        gender: { type: String, enum: ["male", "female"], default: "male" },
        province: { type: String, default: "" },
        city: { type: String, default: "" },
        lastActive: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

schema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

schema.methods.comparePassword = async function (givenPassword) {
    try {
        return await bcryptjs.compare(givenPassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

const User = mongoose.models?.User || mongoose.model("User", schema);

export default User;
