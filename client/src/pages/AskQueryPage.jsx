import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { faqService, queryService } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const querySchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question is too long"),
});

// ─── Expandable FAQ card ──────────────────────────────────────────────────────
const RelatedFAQCard = ({ faq, matchType, isBest = false }) => {
  const [expanded, setExpanded] = useState(isBest); // best match starts open

  return (
    <div
      className={`rounded-xl border transition-all ${
        isBest
          ? "border-teal-200 bg-teal-50"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          {isBest && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-600 mb-1.5">
              <Sparkles className="w-3 h-3" /> Best match
            </span>
          )}
          <p
            className={`font-bold leading-snug ${
              isBest ? "text-teal-900" : "text-stone-800"
            }`}
          >
            {faq.title}
          </p>
          <span
            className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              matchType === "exact"
                ? "bg-teal-100 text-teal-700"
                : matchType === "text"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {matchType === "exact"
              ? "Exact"
              : matchType === "text"
              ? "Text match"
              : "Semantic match"}
          </span>
        </div>
        <span className="flex-shrink-0 mt-1 text-stone-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* Answer — shown when expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-stone-100">
          <p
            className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${
              isBest ? "text-teal-800" : "text-stone-700"
            }`}
          >
            {faq.answer}
          </p>
          {faq.category && (
            <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-stone-100 text-stone-500 rounded-lg">
              {faq.category}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AskQueryPage = () => {
  const [resolveResult, setResolveResult] = useState(null); // { faq, alternatives, matchType }
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(querySchema),
    defaultValues: {
      question: location.state?.question || "",
    },
  });

  const questionValue = watch("question");

  const checkRelated = async () => {
    if (!questionValue || questionValue.length < 10) return;
    setIsChecking(true);
    setResolveResult(null);
    try {
      const res = await faqService.resolve(questionValue);
      setResolveResult(res.data.data); // { faq, alternatives, matchType }
    } catch {
      setResolveResult(null);
    } finally {
      setIsChecking(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: (data) => queryService.submit(data.question),
    onSuccess: () => {
      toast.success("Query submitted successfully! Contributors are on it.");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit query");
    },
  });

  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit your query.");
      navigate("/login", { state: { redirectTo: "/ask", question: data.question } });
      return;
    }
    submitMutation.mutate(data);
  };

  // Build the flat list of related FAQs to render
  const relatedFAQs = resolveResult
    ? [
        ...(resolveResult.faq
          ? [{ faq: resolveResult.faq, matchType: resolveResult.faq.matchType || resolveResult.matchType, isBest: true }]
          : []),
        ...(resolveResult.alternatives || []).map((faq) => ({
          faq,
          matchType: faq.matchType || resolveResult.matchType,
          isBest: false,
        })),
      ]
    : [];

  const hasResults = relatedFAQs.length > 0;

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
          Ask a Question
        </h1>
        <p className="text-stone-500">
          Get fast, accurate answers from expert contributors.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Your Question
          </label>
          <textarea
            {...register("question")}
            rows={4}
            onBlur={checkRelated}
            className={`input-field rounded-2xl px-4 py-3 min-h-[140px] resize-none ${
              errors.question ? "border-red-500" : "border-stone-200"
            }`}
            placeholder="e.g., How does the consensus algorithm ensure accuracy?"
          />
          {errors.question && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.question.message}
            </p>
          )}
        </div>

        {/* Checking indicator */}
        {isChecking && (
          <p className="text-sm text-stone-500 italic animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Searching existing FAQs for "{questionValue}"…
          </p>
        )}

        {/* Related FAQs section */}
        {!isChecking && hasResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-500" />
              <p className="text-sm font-bold text-stone-700">
                {relatedFAQs.length === 1
                  ? "We found an existing answer — does this help?"
                  : `We found ${relatedFAQs.length} related answers — do any of these help?`}
              </p>
            </div>

            <div className="space-y-2">
              {relatedFAQs.map(({ faq, matchType, isBest }, i) => (
                <RelatedFAQCard
                  key={faq._id || i}
                  faq={faq}
                  matchType={matchType}
                  isBest={isBest}
                />
              ))}
            </div>

            <p className="text-xs text-stone-400 flex items-start gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              If none of these answer your question, go ahead and submit — contributors will respond.
            </p>
          </div>
        )}

        {/* No results nudge */}
        {!isChecking && resolveResult && !hasResults && questionValue?.length >= 10 && (
          <p className="text-sm text-stone-600 font-medium italic">
            No existing FAQs matched your question. Submit it below!
          </p>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitMutation.isPending || isChecking}
            className="px-6 py-3 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl font-extrabold tracking-wider transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? "SUBMITTING..." : "SUBMIT QUERY"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskQueryPage;
