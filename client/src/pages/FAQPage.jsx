import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { faqService, sectionService } from "../services/api"; // Import sectionService
import { SearchBar, Select } from "../components/ui/SearchBar"; // Import Select
import { Skeleton } from "../components/ui/Skeleton";
import { BookOpen, ChevronDown, X } from "lucide-react";

const FAQPage = () => {
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState(() => new Set());
  const [activeSection, setActiveSection] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (!selectedSection) return;
    const el = document.getElementById(`section-${selectedSection}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSection]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      let found = null;
      for (const [sectionTitle, ref] of Object.entries(sectionRefs.current)) {
        if (ref) {
          const top = Number(ref.dataset.offsetTop);
          const bottom = Number(ref.dataset.offsetBottom);
          if (scrollPos >= top && scrollPos < bottom) {
            found = sectionTitle;
            break;
          }
        }
      }
      setActiveSection((prev) => (prev !== found ? found : prev));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchAllPages = async (fetchPage) => {
    const firstRes = await fetchPage(1);
    const firstData = firstRes.data.data || [];
    const pagination = firstRes.data.pagination;

    if (!pagination?.hasNextPage) return firstData;

    const totalPages = pagination.totalPages || 1;
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page += 1) {
      pagePromises.push(fetchPage(page));
    }
    const rest = await Promise.all(pagePromises);
    const restData = rest.flatMap((res) => res.data.data || []);

    return [...firstData, ...restData];
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["faqs", search],
    queryFn: async () => {
      if (search) {
        return fetchAllPages((page) =>
          faqService.search(search, { page, limit: 100 }),
        );
      }

      return fetchAllPages((page) => faqService.getAll({ page, limit: 100 }));
    },
  });

  const faqs = data?.docs || data || [];

  const groupedFaqs = useMemo(() => {
    const getTagValue = (tags, prefix) =>
      tags?.find((tag) => tag.startsWith(prefix))?.replace(prefix, "");

    const parseQuestionId = (id) =>
      id
        .split(".")
        .map((part) => Number(part))
        .filter((part) => !Number.isNaN(part));

    const compareQuestionIds = (a, b) => {
      if (!a || !b) return 0;
      const aParts = parseQuestionId(a);
      const bParts = parseQuestionId(b);
      const maxLen = Math.max(aParts.length, bParts.length);
      for (let i = 0; i < maxLen; i += 1) {
        const left = aParts[i] ?? 0;
        const right = bParts[i] ?? 0;
        if (left !== right) return left - right;
      }
      return 0;
    };

    const groups = new Map();
    faqs.forEach((faq) => {
      let sectionTitle = null;
      let sectionOrder = 999;

      if (faq.section && typeof faq.section === "object") {
        sectionTitle = faq.section.title || null;
        sectionOrder = faq.section.order || 999;
      }

      if (!sectionTitle) {
        sectionTitle =
          getTagValue(faq.tags, "section:")
            ?.split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "General";
        sectionOrder = Number(getTagValue(faq.tags, "section-id:") || 999);
      }

      if (!groups.has(sectionTitle)) {
        groups.set(sectionTitle, { sectionTitle, sectionOrder, items: [] });
      }

      const questionId = getTagValue(faq.tags, "qid:") || "";
      groups.get(sectionTitle).items.push({ ...faq, questionId });
    });

    return Array.from(groups.values())
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => {
          if (a.questionId && b.questionId)
            return compareQuestionIds(a.questionId, b.questionId);
          return a.title.localeCompare(b.title);
        }),
      }));
  }, [faqs]);

  const displayedGroups = selectedSection
    ? groupedFaqs.filter((g) => g.sectionTitle === selectedSection)
    : groupedFaqs;

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(faqs.map((faq) => faq._id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  const handleSectionClick = (sectionTitle) => {
    setSelectedSection(sectionTitle === selectedSection ? null : sectionTitle);
  };

  return (
    <div className="w-full font-space-grotesk">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
          Knowledge Base
        </h1>
        <p className="text-stone-500">
          Search through our community-curated FAQs
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-2xl">
          <SearchBar
            placeholder="Search the FAQ — type a keyword"
            onSearch={(val) => setSearch(val)}
            className="bg-white"
          />
        </div>
        <button
          type="button"
          onClick={expandAll}
          className="text-xs font-extrabold uppercase tracking-wider text-stone-600 hover:text-stone-900"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="text-xs font-extrabold uppercase tracking-wider text-stone-600 hover:text-stone-900"
        >
          Collapse all
        </button>
      </div>

      {/* Table of Contents - Only show when not searching */}
      {!search && groupedFaqs.length > 0 && (
        <div className="sticky top-16 z-20 mb-8 bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100 bg-stone-50">
            <BookOpen className="w-4 h-4 text-stone-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
              Table of Contents
            </span>
            {selectedSection && (
              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                className="ml-auto flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800"
              >
                <X className="w-3 h-3" />
                Show All
              </button>
            )}
          </div>
          <div className="flex overflow-x-auto md:flex-wrap gap-2 px-5 py-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {groupedFaqs.map((group) => {
              const isActive = activeSection === group.sectionTitle;
              const isSelected = selectedSection === group.sectionTitle;
              return (
                <button
                  key={group.sectionTitle}
                  type="button"
                  onClick={() => handleSectionClick(group.sectionTitle)}
                  className={`flex items-center shrink-0 whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-teal-600 text-white shadow-sm"
                      : isActive
                        ? "bg-teal-100 text-teal-800 border border-teal-200"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <span>{group.sectionTitle}</span>
                  <span
                    className={`text-[10px] font-extrabold ${isSelected ? "text-teal-200" : "text-stone-400"}`}
                  >
                    {group.items.length}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedSection && (
            <div className="px-5 py-2 bg-teal-50 border-t border-teal-100 flex items-center gap-2">
              <ChevronDown className="w-3 h-3 text-teal-600" />
              <span className="text-xs font-bold text-teal-800">
                Showing: {selectedSection}
              </span>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">
          Failed to load FAQs. Please try again.
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          No FAQs found matching your search.
        </div>
      ) : (
        <div className="space-y-8">
          {displayedGroups.map((group) => (
            <section
              key={group.sectionTitle}
              id={`section-${group.sectionTitle}`}
              ref={(el) => {
                if (el) {
                  sectionRefs.current[group.sectionTitle] = el;
                  const rect = el.getBoundingClientRect();
                  el.dataset.offsetTop = rect.top + window.scrollY;
                  el.dataset.offsetBottom = rect.top + window.scrollY + rect.height;
                }
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-stone-900">
                  {group.sectionTitle}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  {group.items.length} questions
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((faq) => {
                  const isOpen = openIds.has(faq._id);
                  return (
                    <div
                      key={faq._id}
                      id={`faq-${faq._id}`}
                      className="bg-white border border-stone-200 rounded-2xl shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleOpen(faq._id)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-extrabold text-stone-400">
                            {faq.questionId || ""}
                          </span>
                          <span className="text-sm md:text-base font-bold text-stone-900">
                            {faq.title}
                          </span>
                        </div>
                        <span
                          className={`text-stone-400 text-lg transition-transform ${isOpen ? "rotate-45" : ""}`}
                        >
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <div className="text-sm text-stone-600 leading-relaxed mb-4">
                            {faq.answer}
                          </div>
                          <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                            <div className="flex gap-2 flex-wrap">
                              {faq.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs font-bold text-[#0D9488]">
                              {faq.upvotes || 0} Helpful
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQPage;