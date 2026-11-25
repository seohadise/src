import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        // رزرو مرتبط
        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            required: [true, "رزرو الزامی است"],
        },
        // پرداخت مرتبط
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            default: null,
        },
        // مالک (دریافت کننده درآمد)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "مالک الزامی است"],
        },
        // مشتری (پرداخت کننده)
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "مشتری الزامی است"],
        },
        // نوع آیتم
        itemType: {
            type: String,
            enum: ["property", "bus", "food"],
            required: [true, "نوع آیتم الزامی است"],
        },
        // شناسه آیتم
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "شناسه آیتم الزامی است"],
        },
        // ملک مرتبط (برای سازگاری با کد قدیمی)
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            default: null,
        },
        // مالک ملک (برای سازگاری با کد قدیمی)
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // مشتری (برای سازگاری با کد قدیمی)
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // مبلغ پایه (قیمت اصلی ملک)
        baseAmount: {
            type: Number,
            required: [true, "مبلغ پایه الزامی است"],
            min: [0, "مبلغ پایه نمی‌تواند منفی باشد"],
        },
        // درصد کارمزد (پیش‌فرض 6%)
        commissionRate: {
            type: Number,
            default: 6,
            min: [0, "درصد کارمزد نمی‌تواند منفی باشد"],
            max: [100, "درصد کارمزد نمی‌تواند بیشتر از 100 باشد"],
        },
        // مبلغ کارمزد محاسبه شده
        commissionAmount: {
            type: Number,
            required: [true, "مبلغ کارمزد الزامی است"],
            min: [0, "مبلغ کارمزد نمی‌تواند منفی باشد"],
        },
        // درصد بیعانه
        depositRate: {
            type: Number,
            required: [true, "درصد بیعانه الزامی است"],
            min: [10, "بیعانه باید حداقل 10 درصد باشد"],
            max: [100, "بیعانه نمی‌تواند بیشتر از 100 درصد باشد"],
        },
        // مبلغ بیعانه
        depositAmount: {
            type: Number,
            required: [true, "مبلغ بیعانه الزامی است"],
            min: [0, "مبلغ بیعانه نمی‌تواند منفی باشد"],
        },
        // مبلغ کل پرداختی (بیعانه + کارمزد)
        totalPaidAmount: {
            type: Number,
            required: [true, "مبلغ کل پرداختی الزامی است"],
            min: [0, "مبلغ کل پرداختی نمی‌تواند منفی باشد"],
        },
        // مبلغ باقی‌مانده که باید به مالک پرداخت شود
        remainingAmount: {
            type: Number,
            required: [true, "مبلغ باقی‌مانده الزامی است"],
            min: [0, "مبلغ باقی‌مانده نمی‌تواند منفی باشد"],
        },
        // وضعیت کارمزد
        status: {
            type: String,
            enum: ["pending", "collected", "refunded"],
            default: "pending",
        },
        // کد پیگیری پرداخت
        paymentTrackingCode: {
            type: String,
            default: null,
        },
        // تاریخ دریافت کارمزد
        collectedAt: {
            type: Date,
            default: null,
        },
        // یادداشت‌های اضافی
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// ایندکس‌ها برای بهبود عملکرد
schema.index({ property: 1, createdAt: -1 });
schema.index({ owner: 1, status: 1 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ reservation: 1 });

// متد محاسبه خودکار مبالغ
schema.pre("save", function (next) {
    if (this.isNew || this.isModified(["baseAmount", "commissionRate", "depositRate"])) {
        // محاسبه کارمزد
        this.commissionAmount = Math.round((this.baseAmount * this.commissionRate) / 100);

        // محاسبه بیعانه
        this.depositAmount = Math.round((this.baseAmount * this.depositRate) / 100);

        // محاسبه مبلغ کل پرداختی
        this.totalPaidAmount = this.depositAmount + this.commissionAmount;

        // محاسبه مبلغ باقی‌مانده
        this.remainingAmount = this.baseAmount - this.depositAmount;
    }
    next();
});

// متد استاتیک برای محاسبه آمار کارمزدها
schema.statics.getCommissionStats = async function (startDate, endDate) {
    const matchStage = {
        status: "collected",
    };

    if (startDate && endDate) {
        matchStage.collectedAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalCommissions: { $sum: "$commissionAmount" },
                totalTransactions: { $sum: 1 },
                averageCommission: { $avg: "$commissionAmount" },
                totalBaseAmount: { $sum: "$baseAmount" },
            },
        },
    ]);

    return (
        stats[0] || {
            totalCommissions: 0,
            totalTransactions: 0,
            averageCommission: 0,
            totalBaseAmount: 0,
        }
    );
};

// متد استاتیک برای آمار ماهانه
schema.statics.getMonthlyStats = async function (year) {
    return await this.aggregate([
        {
            $match: {
                status: "collected",
                collectedAt: {
                    $gte: new Date(`${year}-01-01`),
                    $lt: new Date(`${year + 1}-01-01`),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$collectedAt" },
                totalCommissions: { $sum: "$commissionAmount" },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
};

const Commission = mongoose.models?.Commission || mongoose.model("Commission", schema);

export default Commission;
