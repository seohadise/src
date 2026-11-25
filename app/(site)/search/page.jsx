import Search from "@/components/search/search";

import { Suspense } from "react";

export const metadata = {
  title: "جستجو",
};

const Page = () => {
  return (
    <Suspense fallback={"در حال بارگذاری ..."}>
      <Search />;
    </Suspense>
  );
};

export default Page;
