import SiteHeader from "../components/layout/SiteHeader.jsx";
import HeroSection from "../components/sections/HeroSection.jsx";
import BottomSection from "../components/sections/BottomSection.jsx";

const HomePage = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f8f7f4] font-home text-stone-900">
      <SiteHeader />
      <HeroSection />
      <BottomSection />
    </div>
  );
};

export default HomePage;
