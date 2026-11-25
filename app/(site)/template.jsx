import Header from "@/components/global/header";
import Footer from "@/components/global/footer";
import MobileHeader from "@/components/global/mobile-header";
import MobileBottomNav from "@/components/global/mobile-bottom-nav";

import { getUser } from "@/lib/helpers";

const SiteTemplate = async ({ children }) => {
  const user = await getUser();

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header isLoggedin={user ? true : false} name={user?.fullName} />
      </div>

      {/* Mobile Header */}
      <MobileHeader isLoggedin={user ? true : false} name={user?.fullName} userType={user?.type} />

      {/* Content with padding for mobile header + bottom nav */}
      <main className="md:pt-0 pt-14 md:pb-0 pb-20">
        {children}
      </main>

      {/* Footer - visible on all screens */}
      <div className="md:pb-0 pb-24">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav isLoggedin={user ? true : false} />
    </>
  );
};

export default SiteTemplate;
