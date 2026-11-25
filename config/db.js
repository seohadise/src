import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) return;

        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        // Database connection error - handled silently
    }
};

export default connectDB;
