import connectDB from "@/config/db";
import UserWallet from "@/components/user/wallet";
import Transaction from "@/models/Transaction";
import { getUser } from "@/lib/helpers";
import { notFound } from "next/navigation";

export const metadata = {
  title: "کیف پول من",
};

export const dynamic = 'force-dynamic';

const WalletPage = async () => {
  try {
    await connectDB();

    const user = await getUser();
    
    if (!user || !user._id) {
      return notFound();
    }

    // Fetch user transactions
    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Convert ObjectId to string for JSON serialization
    const safeTransactions = transactions.map(transaction => ({
      ...transaction,
      _id: transaction._id?.toString() || null,
      user: transaction.user?.toString() || null,
      relatedId: transaction.relatedId?.toString() || null,
    }));

    return <UserWallet user={JSON.parse(JSON.stringify(user))} transactions={safeTransactions} />;
  } catch (error) {
    console.log("Error in wallet page:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">کیف پول من</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          خطایی در بارگذاری کیف پول رخ داده است. لطفا دوباره تلاش کنید.
        </div>
      </div>
    );
  }
};

export default WalletPage;
