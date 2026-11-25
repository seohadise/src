import Profile from "@/components/user/profile";

import { getUser } from "@/lib/helpers";

export const metadata = {
  title: "پروفایل کاربری",
};

// اجبار به dynamic rendering برای استفاده از cookies
export const dynamic = 'force-dynamic';

const Page = async () => {
  const user = await getUser();

  return <Profile user={JSON.parse(JSON.stringify(user))} />;
};

export default Page;
