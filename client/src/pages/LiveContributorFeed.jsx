import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useFeedStore } from "../store/feedStore";
import { queryService, contributorService } from "../services/api";
import { CountdownTimer } from "../components/ui/CountdownTimer";
import { CheckCircle, ChevronDown, ChevronUp, Send, SkipForward } from "lucide-react";
import toast from "react-hot-toast";

// ─── Per-card state machine ───────────────────────────────────────────────────
// idle → accepted → submitted / skipped
// Once the deadline expires the card disappears (socket removes it from store)

const QueryCard = ({ q }) => {
  const { updateQuery } = useFeedStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryId = q._id || q.queryId;

  const [phase, setPhase] = useState("idle"); // "idle" | "accepted" | "submitted" | "skipped"
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to participate in answering queries.");
      navigate("/login", { state: { redirectTo: "/feed" } });
      return;
    }
    try {
      await contributorService.accept(queryId);
      setPhase("accepted");
      setExpanded(true);
      toast.success("Query accepted! Submit your answer before the deadline.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to accept query";
      // If they already accepted, still let them open the answer form
      if (msg.toLowerCase().includes("already")) {
        setPhase("accepted");
        setExpanded(true);
      } else {
        toast.error(msg);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || answer.trim().length < 10) {
      toast.error("Answer must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await contributorService.answer(queryId, { answer: answer.trim(), confidence });
      setPhase("submitted");
      setExpanded(false);
      // Optimistically bump the local counter
      updateQuery(queryId, { responseCount: (q.responseCount || 0) + 1 });
      toast.success("Answer submitted! It will be considered when the deadline passes.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to participate in answering queries.");
      navigate("/login", { state: { redirectTo: "/feed" } });
      return;
    }
    try {
      await contributorService.skip(queryId);
      setPhase("skipped");
      setExpanded(false);
      toast("Query skipped.", { icon: "↩️" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to skip");
    }
  };

  const statusBadge = {
    submitted: (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
        <CheckCircle className="w-3.5 h-3.5" /> Answered
      </span>
    ),
    skipped: (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-500 border border-stone-200 rounded-full text-xs font-bold">
        <SkipForward className="w-3.5 h-3.5" /> Skipped
      </span>
    ),
    accepted: (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
        ✍️ In Progress
      </span>
    ),
  };

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${
        phase === "submitted"
          ? "border-emerald-200 bg-emerald-50/30"
          : phase === "skipped"
          ? "border-stone-200 opacity-60"
          : "border-stone-200"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute top-0 left-0 w-1 h-full ${
          phase === "submitted"
            ? "bg-emerald-500"
            : phase === "accepted"
            ? "bg-amber-500"
            : "bg-[#0D9488]"
        }`}
      />

      {/* Card header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider">
            {q.category || "General"}
          </span>
          <div className="flex items-center gap-2">
            {statusBadge[phase] || null}
            {q.deadline && <CountdownTimer deadline={q.deadline} compact />}
          </div>
        </div>

        <h3 className="text-lg font-bold text-stone-900 mb-5 leading-snug">{q.question}</h3>

        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="flex items-center gap-4 text-sm font-bold text-stone-500">
            <span>{q.responseCount || 0} Responses</span>
            <span>•</span>
            <span>{q.acceptedContributors?.length || 0} Contributors</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {phase === "idle" && (
              <>
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 border border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 rounded-xl text-sm font-bold transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleAccept}
                  className="px-5 py-2 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm"
                >
                  ACCEPT
                </button>
              </>
            )}

            {phase === "accepted" && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" /> Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" /> Write Answer
                  </>
                )}
              </button>
            )}

            {phase === "submitted" && (
              <span className="text-xs text-emerald-600 font-bold">
                Waiting for deadline to pick best answer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inline answer form — only visible after accepting */}
      {phase === "accepted" && expanded && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-stone-100 px-6 pb-6 pt-4 bg-stone-50/60"
        >
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Your Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Write a clear, detailed answer (min. 10 characters)…"
            className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-y bg-white transition"
            required
            minLength={10}
          />

          <div className="mt-4 flex items-center justify-between gap-4">
            {/* Confidence selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-stone-500 whitespace-nowrap">
                Confidence
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfidence(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-colors ${
                      confidence >= n
                        ? "bg-[#B45309] text-white"
                        : "bg-stone-200 text-stone-500 hover:bg-stone-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-xs text-stone-400">
                {["", "Low", "Fairly low", "Moderate", "High", "Very high"][confidence]}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-4 py-2 border border-stone-300 text-stone-600 hover:border-stone-400 rounded-xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-[#0D9488] hover:bg-[#0a7d73] disabled:opacity-50 text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting…" : "Submit Answer"}
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-stone-400">
            The query stays open until the deadline. All answers are compared and the best one
            will be drafted as a FAQ entry for admin review.
          </p>
        </form>
      )}
    </div>
  );
};

// ─── Feed page ────────────────────────────────────────────────────────────────

const LiveContributorFeed = () => {
  const { queries, setQueries } = useFeedStore();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both open and in-progress so returning visitors see everything
      const res = await queryService.getFeed({ limit: 50 });
      setQueries(res.data.data.queries || res.data.data.docs || res.data.data);
    } catch (err) {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [setQueries]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const categories = ["all", ...new Set(queries.map((q) => q.category).filter(Boolean))];

  const visible = queries.filter(
    (q) => activeCategory === "all" || q.category === activeCategory
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
            Live Feed
          </h1>
          <p className="text-stone-500 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B45309] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B45309]" />
            </span>
            Questions stay open until their deadline — contribute your answer for a chance to be
            featured in the FAQ!
          </p>
        </div>

        <button
          onClick={fetchFeed}
          className="text-xs text-stone-500 hover:text-stone-800 font-bold border border-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors ${
                activeCategory === cat
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat === "all" ? `All (${queries.length})` : cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-stone-100 animate-pulse rounded-2xl h-40" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-stone-300 rounded-3xl bg-stone-50">
          <p className="text-stone-500 font-medium">No open queries at the moment.</p>
          <p className="text-stone-400 text-sm mt-1">Waiting for new questions…</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {visible.map((q) => (
            <QueryCard key={q._id || q.queryId} q={q} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveContributorFeed;
