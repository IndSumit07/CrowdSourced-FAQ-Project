import { Link } from "react-router-dom";

/* ─── Premium Live Q&A Preview Card ─── */
const QAPreviewCard = () => (
  <div className="w-full bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-md animate-pulse-card">
    <div className="absolute top-0 left-0 right-0 h-1 bg-teal-600" />

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-display font-bold text-stone-900 text-[15px] shadow-sm">
          VI
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900 leading-tight">
            VINS FAQ System
          </h4>
          <p className="text-[11px] text-teal-600 font-bold">
            Verified Intern Query
          </p>
        </div>
      </div>
      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] text-[10px] font-bold border border-teal-100/60 flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
        Live Answer
      </span>
    </div>

    <div className="flex flex-col gap-2.5 text-left">
      <div className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase leading-none">
        Question
      </div>
      <p className="text-sm font-bold text-stone-900 leading-snug">
        "What is the Vicharanashala internship?"
      </p>

      <div className="w-full h-px bg-stone-100 my-0.5" />

      <div className="text-[10px] font-extrabold text-[#0D9488] tracking-wider uppercase leading-none">
        Top Answer
      </div>
      <p className="text-[12.5px] text-stone-600 font-semibold leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200 shadow-inner">
        "A two-month internship run by Vicharanashala (a research lab at IIT Ropar). You work on a real open-source project under a mentor, after a short training phase. It is free — no charges."
      </p>
    </div>

    <div className="flex items-center justify-between mt-1 text-xs text-stone-500 font-semibold border-t border-stone-100 pt-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[#0D9488] bg-teal-50/50 px-2 py-1 rounded-lg border border-teal-100/30">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 00.458 1.258l1.792 2.149A1 1 0 009 19.5v-3.5h5.518a2 2 0 001.996-1.836l.746-8.191A2 2 0 0015.264 4H10.5v-.5A1.5 1.5 0 009 2h-.5a1 1 0 00-1 1v4.333L6 10.333z" />
          </svg>
          <span className="font-bold">+1.2k Views</span>
        </div>
        <span className="text-[11px] text-stone-400 font-bold">
          100% Community Verified
        </span>
      </div>
      <span className="text-[10px] text-stone-400">Updated 1m ago</span>
    </div>
  </div>
);

/* ─── Avatar helper ─── */
const Avatar = ({ color, darkColor, zIndex, offset }) => (
  <div
    className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shrink-0"
    style={{ marginLeft: offset ? "-8px" : 0, zIndex }}
  >
    <svg
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
    >
      <circle cx="14" cy="14" r="14" fill={color} />
      <circle cx="14" cy="10" r="5" fill={darkColor} />
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
      {/* ── 3-Column Grid ── */}
      <section
        id="values"
        className="bg-[#f8f7f4] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center relative overflow-hidden max-w-350 mx-auto"
      >
        {/* ───────── LEFT COLUMN ───────── */}
        <div className="flex flex-col gap-5 relative">
          {/* Structured Metrics Card */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200 flex flex-col gap-4 text-left">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-none">
              FAQ Coverage
            </div>

            <div className="flex flex-col gap-4">
              {/* Metric 1 */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h5 className="text-[11px] font-bold text-stone-400 leading-none mb-1.5">
                    Total Questions
                  </h5>
                  <p className="text-2xl font-bold text-stone-900 leading-none font-home-display">
                    100+
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-teal-50 text-[#0D9488] text-[9.5px] font-bold shadow-sm">
                  Real FAQs
                </span>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h5 className="text-[11px] font-bold text-stone-400 leading-none mb-1.5">
                    Topic Sections
                  </h5>
                  <p className="text-2xl font-bold text-stone-900 leading-none font-home-display">
                    13
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-stone-100 text-stone-600 text-[9.5px] font-bold shadow-sm">
                  Comprehensive
                </span>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-bold text-stone-400 leading-none mb-1.5">
                    Internship Duration
                  </h5>
                  <p className="text-2xl font-bold text-stone-900 leading-none font-home-display">
                    2 Months
                  </p>
                </div>
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
                    className="w-7 h-7 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[9px] font-bold text-stone-600 shrink-0 shadow-sm"
                    style={{ marginLeft: "-8px", zIndex: 1 }}
                  >
                    +
                  </div>
                </div>
              </div>
            </div>
          </div>

{/* Platform Access Card */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253"
                  />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-stone-900 font-home-display tracking-tight">
                FAQ Sections
              </span>
            </div>

            {/* Section badges */}
            <div className="flex flex-wrap gap-2 ml-0 sm:ml-12">
              {['Internship', 'NOC', 'Certificates', 'ViBe', 'Yaksha'].map((section) => (
                <div
                  key={section}
                  className="px-3 py-1.5 border border-stone-200/50 rounded-lg bg-[#FAF6F0]/50 hover:-translate-y-0.5 transition-transform cursor-pointer text-[11px] font-bold text-stone-700"
                >
                  {section}
                </div>
              ))}
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
            <div className="hidden lg:flex items-center justify-center pr-4 shrink-0">
              <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold text-stone-400 tracking-[2px] uppercase whitespace-nowrap select-none">
                100+ Intern Questions Answered
              </span>
            </div>

            <div className="lg:hidden mb-3 text-[11px] font-bold text-stone-400 tracking-[2px] uppercase whitespace-nowrap">
              100+ Intern Questions Answered
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block w-px bg-stone-300 self-stretch mx-3 shrink-0" />

            {/* Value Propositions & Premium CTA */}
            <div className="flex flex-col justify-between gap-8 pl-1.5">
              <div className="flex flex-col gap-4">
                <div className="text-[11px] font-bold text-teal-600 tracking-widest uppercase">
                  VINS Programme
                </div>
                <h3 className="text-3xl font-bold text-stone-900 leading-tight font-home-display tracking-tight">
                  Intern-First Answers
                </h3>

                <ul className="flex flex-col gap-4 text-stone-600 text-sm font-medium leading-relaxed">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-teal-600 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    <span>
                      <strong>IIT Ropar Certificate:</strong> Earn a certificate
                      from Vicharanashala Lab upon completion.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-teal-600 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    <span>
                      <strong>Real Open-Source Projects:</strong> Work on AI/ML,
                      web dev, NLP, and education-tech projects.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-teal-600 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    <span>
                      <strong>Free Internship:</strong> No charges, no stipend —
                      real experience under expert mentors.
                    </span>
                  </li>
                </ul>
              </div>

              <Link
                to="/faqs"
                className="group flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide w-fit hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm"
              >
                Explore the FAQ Database
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
            </div>
          </div>
        </section>
      </>
  );
};

export default BottomSection;
