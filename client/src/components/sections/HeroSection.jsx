/* ─── Shared cartoon character SVG ─── */
const CharacterSVG = () => (
  <svg
    viewBox="0 0 230 430"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-auto"
  >
    {/* Hair – back layer warm caramel */}
    <ellipse cx="115" cy="138" rx="76" ry="58" fill="#B45309" />
    <ellipse cx="60" cy="190" rx="33" ry="60" fill="#B45309" />
    {/* Hair – front highlight honey amber */}
    <ellipse cx="172" cy="165" rx="25" ry="36" fill="#D97706" />

    {/* Head / face */}
    <ellipse cx="115" cy="208" rx="70" ry="75" fill="#F9A97D" />

    {/* Ears */}
    <ellipse cx="45" cy="213" rx="11" ry="15" fill="#F9A97D" />
    <ellipse cx="185" cy="213" rx="11" ry="15" fill="#F9A97D" />

    {/* Eyes – white sclera + dark iris + highlight */}
    <circle cx="92"  cy="204" r="11" fill="#292524" />
    <circle cx="138" cy="204" r="11" fill="#292524" />
    <circle cx="95"  cy="200" r="4.5" fill="white" />
    <circle cx="141" cy="200" r="4.5" fill="white" />

    {/* Blushing cheeks */}
    <ellipse cx="74"  cy="226" rx="14" ry="9" fill="#FCA5A5" opacity="0.65" />
    <ellipse cx="156" cy="226" rx="14" ry="9" fill="#FCA5A5" opacity="0.65" />

    {/* Open mouth – talking */}
    <ellipse cx="115" cy="240" rx="20" ry="14" fill="#7F1D1D" />
    <ellipse cx="115" cy="235" rx="14" ry="7"  fill="#F472B6" opacity="0.25" />

    {/* Body */}
    <rect x="52" y="268" width="122" height="162" rx="28" fill="#F9A97D" />
    {/* Shirt stripes – soothing sage, cream peach, rust */}
    <rect x="52" y="286" width="122" height="17" fill="#0D9488" opacity="0.75" />
    <rect x="52" y="318" width="122" height="15" fill="#FDBA74" opacity="0.85" />
    <rect x="52" y="348" width="122" height="15" fill="#C2410C" opacity="0.75" />

    {/* Right arm reaching up toward tin can */}
    <path
      d="M172 292 Q208 272 213 248"
      stroke="#F9A97D"
      strokeWidth="28"
      strokeLinecap="round"
    />

    {/* Sage Green tin can */}
    <rect x="198" y="218" width="32" height="56" rx="7" fill="#0D9488" />
    <rect x="198" y="218" width="32" height="9"  rx="4.5" fill="#0F766E" />
    <rect x="198" y="265" width="32" height="9"  rx="4.5" fill="#0F766E" />
    {/* Can ridges */}
    <rect x="198" y="232" width="32" height="2.5" fill="#CCFBF1" opacity="0.9" />
    <rect x="198" y="240" width="32" height="2.5" fill="#CCFBF1" opacity="0.9" />
    <rect x="198" y="248" width="32" height="2.5" fill="#CCFBF1" opacity="0.9" />
    <rect x="198" y="256" width="32" height="2.5" fill="#CCFBF1" opacity="0.9" />

    {/* String going off-screen right */}
    <line x1="230" y1="246" x2="290" y2="246" stroke="#57534E" strokeWidth="1.5" />
  </svg>
);

/* ─── Hero Section ─── */
const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative flex items-center justify-center overflow-hidden bg-transparent pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24"
      style={{ minHeight: "570px" }}
    >
      {/* Background blobs removed completely */}

      {/* Left character – floats gently, hidden on mobile/tablet */}
      <div className="hidden lg:block absolute left-0 bottom-0 w-48 xl:w-60 z-[1] animate-float">
        <CharacterSVG />
      </div>

      {/* Right character – horizontally mirrored + slight delay, hidden on mobile/tablet */}
      <div
        className="hidden lg:block absolute right-0 bottom-0 w-48 xl:w-60 z-[1] animate-float-rev"
      >
        <CharacterSVG />
      </div>

      {/* ── Center content ── */}
      <div className="relative z-10 text-center px-4 max-w-[690px]">

        {/* Row 1 – pill "Fast &" + answers counter */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-2">

          {/* Outlined pill box */}
          <div className="flex items-center gap-2 md:gap-3 border-2 border-stone-850 rounded-full py-1.5 pl-1.5 pr-4 md:py-2 md:pl-2 md:pr-6 bg-white/40 backdrop-blur-sm shadow-sm">
            {/* Avatar with soothing sage green badge dot */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white bg-teal-50">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                  <circle cx="24" cy="24" r="24" fill="#0D9488" />
                  <circle cx="24" cy="18" r="9"  fill="#0F766E" />
                  <path d="M6 44c0-10 8-14 18-14s18 4 18 14" fill="#0F766E" />
                </svg>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-[#B45309] border-2 border-white" />
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] font-black text-stone-900 leading-none tracking-tight whitespace-nowrap font-serif-display">
              Fast &amp;
            </span>
          </div>

          {/* Counter badge */}
          <div className="text-left flex-shrink-0">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-[26px] font-bold text-[#B45309] leading-tight font-serif-display">50k+</div>
            <div className="text-[10px] md:text-xs text-stone-500 font-semibold leading-tight">Verified FAQs</div>
          </div>
        </div>

        {/* Row 2 – reliable answers */}
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold text-stone-900 leading-[1.1] tracking-tight font-serif-display">
          reliable answers
        </div>

        {/* Row 3 – by the community + sage arrow pill */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mt-1">
          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold text-stone-900 leading-[1.1] tracking-tight font-serif-display">
            by the community
          </span>
          {/* Sage arrow circle */}
          <div className="w-10 h-10 md:w-[58px] md:h-[58px] border-2 border-stone-850 rounded-full flex items-center justify-center flex-shrink-0 bg-white shadow-sm hover:border-[#0D9488] transition-colors">
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="#0D9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base leading-relaxed sm:leading-7 text-stone-600 max-w-md mx-auto font-medium">
          A crowdsourced Q&amp;A base powered by verified contributors. Get clear, community-voted answers to your questions, instantly.
        </p>

        {/* CTA row */}
        <div className="mt-7 flex items-center justify-center gap-4">
          {/* Primary button */}
          <button className="bg-stone-900 hover:bg-[#B45309] text-white rounded-full px-6 py-3 md:px-7 md:py-[14px] text-xs sm:text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer">
            Browse Trusted FAQs
          </button>
          {/* Ask question button */}
          <button 
            className="group w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center hover:border-stone-800 hover:bg-stone-800 hover:text-white transition-all duration-200 cursor-pointer" 
            title="Ask a Question"
          >
            <svg 
              className="w-4 h-4 md:w-5 md:h-5 text-stone-800 group-hover:text-white transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Decorative elements are removed or simplified to be subtle dots of warm color */}
      <div
        className="absolute w-2.5 h-2.5 bg-[#B45309] rounded-full opacity-40 pointer-events-none"
        style={{ bottom: "80px", left: "42%" }}
      />
    </section>
  );
};

export default HeroSection;
