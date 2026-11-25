import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "عنوان مقاله الزامی است"],
        },
        slug: {
            type: String,
            required: [true, "اسلاگ مقاله الزامی است"],
            unique: true,
        },
        summary: {
            type: String,
            default: "",
        },
        content: {
            type: String,
            required: [true, "محتوای مقاله الزامی است"],
        },
        coverImage: {
            type: String,
            default: "",
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "نویسنده الزامی است"],
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
        },
        publishedAt: {
            type: Date,
            default: null,
        },
        views: {
            type: Number,
            default: 0,
        },
        tags: [{
            type: String,
        }],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
schema.index({ slug: 1 });
schema.index({ status: 1, publishedAt: -1 });
schema.index({ tags: 1 });

// Generate slug from title
schema.pre("save", function (next) {
    if (this.isNew || this.isModified("title")) {
        if (!this.slug) {
            this.slug = this.title
                .toLowerCase()
                .replace(/[^\u0600-\u06FFa-z0-9\s]/g, "")
                .replace(/\s+/g, "-")
                .substring(0, 100);
        }
    }
    
    // Set publishedAt when status changes to published
    if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    next();
});

const Article = mongoose.models?.Article || mongoose.model("Article", schema);

export default Article;
