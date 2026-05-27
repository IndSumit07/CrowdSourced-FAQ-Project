/* ─── Premium Live Q&A Preview Card ─── */
const QAPreviewCard = () => (
  <div className="w-full bg-white rounded-3xl p-6 shadow-soft border border-stone-200/50 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-strong animate-pulse-card">
    {/* Accent top gradient line */}
    <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#B45309] to-[#0D9488]" />

    {/* Header info */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FFF7ED] border-2 border-stone-150 flex items-center justify-center font-serif-display font-black text-[#B45309] text-[15px] shadow-sm">
          SC
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900 leading-tight">Sarah Chen</h4>
          <p className="text-[11px] text-[#B45309] font-bold">Credibility Score: 9.8k</p>
        </div>
      </div>
      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] text-[10px] font-bold border border-teal-100/60 flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
        Verified Expert
      </span>
    </div>

    {/* Thread details */}
    <div className="flex flex-col gap-2.5 text-left">
      <div className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase leading-none">Question</div>
      <p className="text-sm font-bold text-stone-900 leading-snug">
        "How does the consensus engine filter out incorrect FAQ answers?"
      </p>
      
      <div className="w-full h-px bg-stone-100 my-0.5" />
      
      <div className="text-[10px] font-extrabold text-[#0D9488] tracking-wider uppercase leading-none">Top Answer</div>
      <p className="text-[12.5px] text-stone-600 font-semibold leading-relaxed bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200/40 shadow-inner">
        "Answers undergo multi-stage voting weighted by contributor credibility. Spam and incorrect details are flagged automatically by community consensus in under 45 seconds."
      </p>
    </div>

    {/* Footer interactions */}
    <div className="flex items-center justify-between mt-1 text-xs text-stone-500 font-semibold border-t border-stone-100 pt-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[#0D9488] bg-teal-50/50 px-2 py-1 rounded-lg border border-teal-100/30">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 00.458 1.258l1.792 2.149A1 1 0 009 19.5v-3.5h5.518a2 2 0 001.996-1.836l.746-8.191A2 2 0 0015.264 4H10.5v-.5A1.5 1.5 0 009 2h-.5a1 1 0 00-1 1v4.333L6 10.333z" />
          </svg>
          <span className="font-bold">+284 Upvotes</span>
        </div>
        <span className="text-[11px] text-stone-400 font-bold">99.4% Consensus</span>
      </div>
      <span className="text-[10px] text-stone-400">Updated 2m ago</span>
    </div>
  </div>
);

/* ─── Avatar helper ─── */
const Avatar = ({ color, darkColor, zIndex, offset }) => (
  <div
    className="w-7 h-7 rounded-full border-2 border-white overflow-hidden flex-shrink-0"
    style={{ marginLeft: offset ? "-8px" : 0, zIndex }}
  >
    <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <circle cx="14" cy="14" r="14" fill={color} />
      <circle cx="14" cy="10" r="5"  fill={darkColor} />
      <path d="M2 26c0-6 5-8 12-8s12 2 12 8" fill={darkColor} />
    </svg>
  </div>
);

/* ─── Bottom Section ─── */
const BottomSection = () => {
  const avatars = [
    { color: "#D97706", dark: "#92400E" },
    { color: "#0D9488", dark: "#0F766E" },
    { color: "#FDBA74", dark: "#C2410C" },
    { color: "#A78BFA", dark: "#6D28D9" },
  ];

  return (
    <>
      {/* ── Wave divider ── */}
      <div className="w-full overflow-hidden bg-transparent -mb-1">
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="w-full h-14"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z"
            fill="#FAF5EE"
          />
        </svg>
      </div>

      {/* ── 3-Column Grid ── */}
      <section className="bg-[#FAF5EE] px-4 sm:px-10 pt-8 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-center relative overflow-hidden">

        {/* ───────── LEFT COLUMN ───────── */}
        <div className="flex flex-col gap-5 relative">

          {/* Structured Metrics Card */}
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-stone-200/40 flex flex-col gap-4 text-left">
            <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest leading-none">Trust Profile</div>
            
            <div className="flex flex-col gap-3.5">
              {/* Metric 1 */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div>
                  <h5 className="text-[11px] font-bold text-stone-400 leading-none mb-1.5">Consensus Score</h5>
                  <p className="text-xl font-bold text-stone-900 leading-none font-serif-display">99.4%</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0D9488] text-[9.5px] font-bold border border-teal-100/50 shadow-sm">High Accuracy</span>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div>
                  <h5 className="text-[11px] font-bold text-stone-400 leading-none mb-1.5">Avg Response Time</h5>
                  <p className="text-xl font-bold text-stone-900 leading-none font-serif-display">45 Sec</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-orange-50 text-[#B45309] text-[9.5px] font-bold border border-orange-100/50 shadow-sm">Instant Audit</span>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-bold text-stone-400 leading-none mb-1.5">Expert Curators</h5>
                  <p className="text-xl font-bold text-stone-900 leading-none font-serif-display">10,480+</p>
                </div>
                {/* Mini avatars */}
                <div className="flex items-center">
                  {avatars.map((av, i) => (
                    <Avatar
                      key={i}
                      color={av.color}
                      darkColor={av.dark}
                      zIndex={10 - i}
                      offset={i > 0}
                    />
                  ))}
                  <div
                    className="w-7 h-7 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[9px] font-bold text-stone-600 flex-shrink-0 shadow-sm"
                    style={{ marginLeft: "-8px", zIndex: 1 }}
                  >
                    +
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community Integrations Card */}
          <div className="bg-white rounded-3xl p-5 shadow-soft border border-stone-200/40 text-left">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#0D9488]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                </svg>
              </div>
              <span className="text-sm font-bold text-stone-900 font-serif-display">Cross-Platform FAQs</span>
            </div>

            {/* Platform icons row */}
            <div className="flex gap-3 ml-12">
              {/* Google */}
              <div className="w-10 h-10 border border-stone-200/50 rounded-xl flex items-center justify-center bg-[#FAF6F0]/50 hover:-translate-y-1 transition-transform cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>

              {/* Behance */}
              <div className="w-10 h-10 border border-stone-200/50 rounded-xl flex items-center justify-center bg-[#FAF6F0]/50 hover:-translate-y-1 transition-transform cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 11.5c.83 0 1.5-.67 1.5-1.5S6.83 8.5 6 8.5H3v3h3zm.5 2H3v3.5h3.5c.83 0 1.5-.67 1.5-1.5 0-.97-.67-2-1.5-2zM16 10c-1.66 0-3 1.34-3 3h4.5c0-.83-.67-1.5-1.5-1.5-.83 0-1.5.67-1.5 1.5H13c0-1.66 1.34-3 3-3zm-3 4c.17.97 1.03 1.7 2 1.7.55 0 1.04-.22 1.4-.58l1.42 1.42C19.1 17.52 18.1 18 16 18c-2.21 0-4-1.79-4-4h1zm6.5-5h-5v1h5V9z"
                    fill="#1769FF"
                  />
                </svg>
              </div>

              {/* Reddit */}
              <div className="w-10 h-10 border border-stone-200/50 rounded-xl flex items-center justify-center bg-[#FAF6F0]/50 hover:-translate-y-1 transition-transform cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.92 13.11c.05.27.08.55.08.84 0 2.65-3.14 4.8-7 4.8s-7-2.15-7-4.8c0-.29.03-.57.08-.84A1.5 1.5 0 015.5 10.5c.4 0 .77.16 1.04.42 1.01-.67 2.39-1.1 3.91-1.15l.74-3.28 2.38.53a1.25 1.25 0 101.35-.18l-2.1-.47-.65 2.93c1.49.06 2.84.49 3.84 1.15.27-.26.64-.42 1.04-.42.82 0 1.45.62 1.45 1.38 0 .43-.2.81-.52 1.06l-.11.05zm-9.17-.86a.75.75 0 101.5 0 .75.75 0 00-1.5 0zm5.82 2.28a2.6 2.6 0 01-2.57 0 .25.25 0 00-.35.35 3.1 3.1 0 003.27 0 .25.25 0 00-.35-.35zm-.32-1.53a.75.75 0 101.5 0 .75.75 0 00-1.5 0z"
                    fill="#FF4500"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── CENTER COLUMN ───────── */}
        <div className="flex items-center justify-center">
          <QAPreviewCard />
        </div>

        {/* ───────── RIGHT COLUMN ───────── */}
        <div className="flex items-stretch text-left">
          {/* Vertical text label */}
          <div className="flex items-center justify-center pr-4 flex-shrink-0">
            <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold text-stone-400 tracking-[2px] uppercase whitespace-nowrap select-none">
              5M+ Answers Served
            </span>
          </div>

          {/* Vertical divider */}
          <div className="w-px bg-stone-300 self-stretch mx-3 flex-shrink-0" />

          {/* Value Propositions & Premium CTA */}
          <div className="flex flex-col justify-between gap-6 pl-1.5">
            <div className="flex flex-col gap-3.5">
              <div className="text-[10px] font-extrabold text-[#B45309] tracking-widest uppercase">System Values</div>
              <h3 className="text-xl font-bold text-stone-900 leading-tight font-serif-display">Uncompromised Quality</h3>
              
              <ul className="flex flex-col gap-3 text-stone-600 text-xs font-semibold leading-relaxed">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#0D9488] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><strong>Consensus Audited:</strong> Multi-layered voting instantly flags incorrect answers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#0D9488] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><strong>Ultra-Fast Speed:</strong> Peer consensus verifies new solutions in under a minute.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#0D9488] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><strong>Spam-Free Archive:</strong> Community moderators maintain accurate and direct explanations.</span>
                </li>
              </ul>
            </div>

            <button className="group flex items-center gap-2 bg-[#B45309] hover:bg-stone-900 text-[#FAF6F0] rounded-full pl-5 pr-2 py-3 text-sm font-semibold w-fit hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-soft">
              Explore the FAQ Database
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 stroke-white" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 2v8M3 7l4 4 4-4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

      </section>
    </>
  );
};

export default BottomSection;
