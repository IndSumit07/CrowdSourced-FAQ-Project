import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative flex items-center justify-center overflow-hidden bg-[#f8f7f4] pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24"
      style={{ minHeight: "570px" }}
    >
      {/* Abstract background shapes */}
      <div className="absolute top-1/4 left-1/4 w-130 h-130 bg-teal-100/45 rounded-full blur-[110px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-105 h-105 bg-amber-100/35 rounded-full blur-[110px] -z-10" />

      {/* Center content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        {/* Badge pill */}
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full px-4 py-2 mb-8 shadow-sm hover:shadow-md transition-shadow">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-600 tracking-wide uppercase">
            Community-Powered Q&A Platform
          </span>
        </div>

        {/* Main headline */}
        <div className="space-y-2 mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-stone-900 leading-tight tracking-tight font-home-display">
            Get <span className="text-teal-600">Fast</span> & Reliable
          </h1>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-stone-900 leading-tight tracking-tight font-home-display">
            Answers From Community
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed">
          A crowdsourced FAQ platform where knowledge meets consensus. Get
          clear, community-vetted answers to all your questions instantly.
        </p>

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 w-full">
          <Link
            to="/faqs"
            className="group inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full px-8 py-4 text-sm font-bold tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 shadow-sm w-full sm:w-auto"
          >
            Browse Trusted FAQs
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <Link
            to="/ask"
            className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-full px-8 py-4 text-sm font-bold tracking-wide hover:border-teal-600 hover:text-teal-600 transition-all duration-200 shadow-sm w-full sm:w-auto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            Ask a Question
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-stone-200/60 w-full max-w-3xl">
          <div className="text-center">
            <div className="text-3xl font-bold text-stone-900 font-display">
              50k+
            </div>
            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider mt-1">
              Verified FAQs
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-stone-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-stone-900 font-display">
              10k+
            </div>
            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider mt-1">
              Expert Curators
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-stone-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 font-display">
              99.4%
            </div>
            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider mt-1">
              Accuracy Rate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
