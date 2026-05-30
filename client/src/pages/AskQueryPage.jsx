import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryService, faqService } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  AlertCircle,
  Bot,
  Send,
  Loader2,
  MessageSquareWarning,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const querySchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question is too long"),
});

// ─── AI Answer Card ───────────────────────────────────────────────────────────
const AIAnswerCard = ({ answer }) => {
  if (!answer) return null;
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100">
          <Bot className="w-4 h-4 text-violet-600" />
        </div>
        <span className="text-sm font-extrabold uppercase tracking-wider text-violet-700">
          AI Answer
        </span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full">
          Powered by OpenRouter
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
        {answer}
      </p>
    </div>
  );
};

// ─── Expandable Related FAQ Card ──────────────────────────────────────────────
const RelatedFAQCard = ({ faq, isBest = false }) => {
  const [expanded, setExpanded] = useState(isBest);
  const matchType = faq.matchType || "semantic";

  return (
    <div
      className={`rounded-xl border transition-all ${
        isBest
          ? "border-teal-200 bg-teal-50"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const AskQueryPage = () => {
  const [ragResult, setRagResult] = useState(null); // { aiAnswer, relatedFAQs }
  const [isAsking, setIsAsking] = useState(false);
  const debounceTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/dashboard", { replace: true });
      toast.error("Administrators are not permitted to submit queries.");
    }
  }, [user, navigate]);

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

  // Trigger RAG on textarea blur
  const runRAG = async (q) => {
    if (!q || q.trim().length < 10) return;
    setIsAsking(true);
    setRagResult(null);
    try {
      const res = await queryService.askQuery(q.trim());
      setRagResult(res.data.data); // { aiAnswer, relatedFAQs }
    } catch {
      // OpenRouter or server failure — gracefully fall back to FAQ search only
      try {
        const res = await faqService.resolve(q.trim());
        const resolution = res.data.data;
        const fallbackFAQs = [
          ...(resolution.faq ? [{ ...resolution.faq, isBest: true }] : []),
          ...(resolution.alternatives || []).map((f) => ({ ...f, isBest: false })),
        ];
        setRagResult({ aiAnswer: null, relatedFAQs: fallbackFAQs });
      } catch {
        // Both failed — show nothing silently
        setRagResult(null);
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleBlur = () => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runRAG(questionValue), 300);
  };

  const submitMutation = useMutation({
    mutationFn: (data) => queryService.submit(data.question),
    onSuccess: () => {
      toast.success("Query submitted! Contributors are on it.");
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

  const hasAIAnswer = ragResult?.aiAnswer;
  const relatedFAQs = ragResult?.relatedFAQs || [];
  const hasRelated = relatedFAQs.length > 0;

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
          Ask a Question
        </h1>
        <p className="text-stone-500">
          Get an instant AI answer, then submit to expert contributors if you need more.
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-700 flex-shrink-0" />
          <p>
            If the AI answer doesn't fully satisfy you, submit your query and our
            expert contributors will respond.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Question textarea */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Your Question
          </label>
          <textarea
            {...register("question")}
            rows={4}
            onBlur={handleBlur}
            className={`input-field rounded-2xl px-4 py-3 min-h-[140px] resize-none w-full ${
              errors.question ? "border-red-500" : "border-stone-200"
            }`}
            placeholder="e.g., How do I prepare for a Google SWE internship interview?"
          />
          {errors.question && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.question.message}
            </p>
          )}
        </div>

        {/* Loading state */}
        {isAsking && (
          <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-violet-800">
                Searching knowledge base &amp; generating AI answer…
              </p>
              <p className="text-xs text-violet-600 mt-0.5">
                Retrieving related FAQs · Running RAG
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isAsking && ragResult && (
          <div className="space-y-4">
            {/* AI Answer */}
            {hasAIAnswer && <AIAnswerCard answer={ragResult.aiAnswer} />}

            {/* Related FAQs */}
            {hasRelated && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-stone-500" />
                  <p className="text-sm font-bold text-stone-700">
                    {relatedFAQs.length === 1
                      ? "Related FAQ from our knowledge base"
                      : `${relatedFAQs.length} related FAQs from our knowledge base`}
                  </p>
                </div>
                <div className="space-y-2">
                  {relatedFAQs.map((faq, i) => (
                    <RelatedFAQCard
                      key={faq._id || i}
                      faq={faq}
                      isBest={faq.isBest}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No FAQ matches but AI answer exists */}
            {!hasRelated && hasAIAnswer && (
              <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                <MessageSquareWarning className="w-4 h-4 mt-0.5 text-stone-400 flex-shrink-0" />
                <p>
                  No existing FAQs matched exactly. Submit below for expert contributor responses.
                </p>
              </div>
            )}

            {/* Encourage submission */}
            <p className="text-sm text-stone-500 font-medium">
              Not fully satisfied? Submit your query and our expert contributors will respond.
            </p>
          </div>
        )}

        {/* First-visit nudge */}
        {!isAsking && !ragResult && questionValue?.length >= 10 && (
          <p className="text-sm text-stone-500 italic">
            Click outside the text area to search our knowledge base.
          </p>
        )}

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitMutation.isPending || isAsking}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl font-extrabold tracking-wider transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending ? "SUBMITTING…" : "SUBMIT TO CONTRIBUTORS"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskQueryPage;
