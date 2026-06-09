import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { adminService, sectionService } from "../../services/api";
import {
  StatsGridSkeleton,
  PendingQueriesSkeleton,
  PendingFAQsSkeleton,
  RejectedQueriesSkeleton,
} from "../../components/skeleton-loaders";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Send,
  Users,
  MessageSquare,
  CheckSquare,
  Clock,
  AlertCircle,
  Bot,
  Plus,
  Folder,
  FileText,
  X,
  Flag,
  RotateCcw,
  Trash2,
} from "lucide-react";

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  const [showAddFaq, setShowAddFaq] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const [addFaqForm, setAddFaqForm] = useState({
    title: "",
    answer: "",
    sectionId: "",
    tags: "",
  });
  const [faqNewSectionName, setFaqNewSectionName] = useState("");
  const [showFaqNewSectionInput, setShowFaqNewSectionInput] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await adminService.getStats();
      const payload = res.data.data;
      return payload.stats ?? payload;
    },
  });

  const { data: pendingFAQs, isLoading: faqsLoading } = useQuery({
    queryKey: ["pending-faqs"],
    queryFn: async () => {
      const res = await adminService.getPendingFAQs();
      // Server returns { faqs: [...], total: N } — extract the array
      const payload = res.data.data;
      return Array.isArray(payload) ? payload : (payload.faqs ?? []);
    },
  });

  const { data: pendingQueries, isLoading: queriesLoading } = useQuery({
    queryKey: ["pending-review-queries"],
    queryFn: async () => {
      const res = await adminService.getPendingReviewQueries();
      const payload = res.data.data;
      return Array.isArray(payload) ? payload : (payload.queries ?? []);
    },
  });

  const { data: rejectedQueries, isLoading: rejectedLoading } = useQuery({
    queryKey: ["rejected-queries"],
    queryFn: async () => {
      const res = await adminService.getRejectedQueries();
      const payload = res.data.data;
      return Array.isArray(payload) ? payload : (payload.queries ?? []);
    },
  });

  // Track per-query: { responseId, answer } object
  const [selectedResponse, setSelectedResponse] = useState({});
  // Track edited final answer text per query
  const [finalAnswer, setFinalAnswer] = useState({});
  // Track selected section per query
  const [selectedSection, setSelectedSection] = useState({});
  // Track selected section per pending FAQ
  const [selectedPendingSection, setSelectedPendingSection] = useState({});
  // Track "create new section" input per query
  const [newSectionName, setNewSectionName] = useState({});
  // Track whether to show new section input per query
  const [showNewSectionInput, setShowNewSectionInput] = useState({});

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await sectionService.getAll();
      return res.data.data.sections || [];
    },
  });

const createSectionMutation = useMutation({
    mutationFn: (title) => sectionService.create({ title }),
    onSuccess: (res) => {
      const section = res.data.data.section;
      queryClient.invalidateQueries(["sections"]);
      toast.success(`Section "${section.title}" created`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create section"),
  });

  const handleSelectAnswer = (queryId, ans) => {
    setSelectedResponse((prev) => ({
      ...prev,
      [queryId]: { id: ans._id, answer: ans.answer },
    }));
    // Only pre-fill if no custom text has been typed
    setFinalAnswer((prev) => ({ ...prev, [queryId]: ans.answer }));
  };

  const handleUnselectAnswer = (queryId) => {
    setSelectedResponse((prev) => {
      const next = { ...prev };
      delete next[queryId];
      return next;
    });
    setFinalAnswer((prev) => {
      const next = { ...prev };
      delete next[queryId];
      return next;
    });
  };

  const handleSelectAiAnswer = (queryId, aiAnswer) => {
    setSelectedResponse((prev) => ({
      ...prev,
      [queryId]: { id: null, answer: aiAnswer },
    }));
    setFinalAnswer((prev) => ({ ...prev, [queryId]: aiAnswer }));
  };

  const handleSelectSection = (queryId, sectionId) => {
    setSelectedSection((prev) => ({ ...prev, [queryId]: sectionId }));
    setShowNewSectionInput((prev) => ({ ...prev, [queryId]: false }));
  };

  const handleCreateNewSection = (queryId) => {
    const name = newSectionName[queryId]?.trim();
    if (!name) return;
    createSectionMutation.mutate(name, {
      onSuccess: (res) => {
        const section = res.data.data.section;
        setSelectedSection((prev) => ({ ...prev, [queryId]: section._id }));
        setNewSectionName((prev) => {
          const n = { ...prev };
          delete n[queryId];
          return n;
        });
        setShowNewSectionInput((prev) => ({ ...prev, [queryId]: false }));
      },
    });
  };

  const publishQueryMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.publishQueryToFAQ(id, data),
    onSuccess: () => {
      toast.success("Query Published as FAQ successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-review-queries"] });
      queryClient.invalidateQueries({ queryKey: ["rejected-queries"] });
      queryClient.invalidateQueries({ queryKey: ["pending-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to publish query"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.approveFAQ(id, data),
    onSuccess: () => {
      toast.success("FAQ Published successfully!");
      queryClient.invalidateQueries(["pending-faqs"]);
      queryClient.invalidateQueries(["admin-stats"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to approve FAQ"),
  });

const rejectMutation = useMutation({
    mutationFn: (id) => adminService.rejectFAQ(id, "Admin rejected draft"),
    onSuccess: () => {
      toast.success("FAQ Draft rejected.");
      queryClient.invalidateQueries(["pending-faqs"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to reject FAQ"),
  });

  const restoreQueryMutation = useMutation({
    mutationFn: (id) => adminService.restoreQuery(id),
    onSuccess: () => {
      toast.success("Query restored to feed!");
      queryClient.invalidateQueries(["rejected-queries"]);
      queryClient.invalidateQueries(["admin-stats"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to restore query"),
  });

  const deleteQueryMutation = useMutation({
    mutationFn: (id) => adminService.deleteQuery(id),
    onSuccess: () => {
      toast.success("Query deleted permanently.");
      queryClient.invalidateQueries(["pending-review-queries"]);
      queryClient.invalidateQueries(["rejected-queries"]);
      queryClient.invalidateQueries(["admin-stats"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete query"),
  });

  const createDirectFaqMutation = useMutation({
    mutationFn: (data) => adminService.createDirectFAQ(data),
    onSuccess: () => {
      toast.success("FAQ created and published successfully!");
      queryClient.invalidateQueries(["admin-stats"]);
      queryClient.invalidateQueries(["faqs"]);
      setShowAddFaq(false);
      setAddFaqForm({ title: "", answer: "", sectionId: "", tags: "" });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create FAQ"),
  });

  const createFaqSectionMutation = useMutation({
    mutationFn: (title) => sectionService.create({ title }),
    onSuccess: (res) => {
      const section = res.data.data.section;
      queryClient.invalidateQueries(["sections"]);
      setAddFaqForm((p) => ({ ...p, sectionId: section._id }));
      setFaqNewSectionName("");
      setShowFaqNewSectionInput(false);
      toast.success(`Section "${section.title}" created`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create section"),
  });

  const handleAddFaqSubmit = (e) => {
    e.preventDefault();
    const tags = addFaqForm.tags
      ? addFaqForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    createDirectFaqMutation.mutate({
      title: addFaqForm.title,
      answer: addFaqForm.answer,
      sectionId: addFaqForm.sectionId,
      tags,
    });
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 font-display mb-2 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-stone-500 text-sm">
            Platform overview and content moderation
          </p>
        </div>
        <button
          onClick={() => setShowAddFaq(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
        {statsLoading ? (
          <StatsGridSkeleton />
        ) : (
          <>
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest">
                  Total Users
                </p>
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-4xl font-display font-bold text-stone-900">
                {stats?.users?.total ?? "—"}
              </p>
            </div>
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest">
                  Total Queries
                </p>
                <MessageSquare className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-4xl font-display font-bold text-stone-900">
                {stats?.queries?.total ?? "—"}
              </p>
            </div>
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest">
                  Published FAQs
                </p>
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-4xl font-display font-bold text-stone-900">
                {stats?.faqs?.published ?? stats?.publishedFaqs ?? "—"}
              </p>
            </div>
            <div className="bg-white border border-red-100 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-red-500 text-[11px] font-bold uppercase tracking-widest">
                  Pending Review
                </p>
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-4xl font-display font-bold text-red-600">
                {pendingQueries?.length ?? stats?.queries?.adminReview ?? "—"}
              </p>
            </div>
            <div className="bg-white border border-orange-200 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-orange-500 text-[11px] font-bold uppercase tracking-widest">
                  Flagged & Removed
                </p>
                <Flag className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-4xl font-display font-bold text-orange-600">
                {rejectedQueries?.length ?? stats?.queries?.flagged ?? "—"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Section 1: Pending Review Queries section */}
      <div className="mb-6 mt-12 border-b border-stone-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-display tracking-tight">
            Pending Review (Expired Queries)
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Select the best contributor answer, edit if needed, then publish to
            the FAQ database
          </p>
        </div>
      </div>

      {queriesLoading ? (
        <PendingQueriesSkeleton />
      ) : pendingQueries?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 rounded-3xl bg-white shadow-sm">
          <CheckSquare className="w-12 h-12 text-stone-300 mb-4" />
          <p className="text-stone-600 font-semibold text-lg font-display tracking-tight">
            No expired queries pending review.
          </p>
          <p className="text-stone-400 text-sm mt-1">
            You're all caught up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 mb-12">
          {pendingQueries?.map((query) => {
            const sel = selectedResponse[query._id];
            const currentAnswer = finalAnswer[query._id] || "";
            const hasAnswers = query.answers?.length > 0;

            return (
              <div
                key={query._id}
                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="flex gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {query.category}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    admin-review
                  </span>
                </div>

                <h3 className="text-xl font-bold text-stone-900 mb-5 font-display tracking-tight leading-snug">
                  {query.question}
                </h3>

                {/* AI Generated Answer */}
                {query.aiSynthesizedAnswer && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-bold text-stone-700 flex items-center gap-2 uppercase tracking-wider">
                      <Bot className="h-4 w-4 text-purple-400" />
                      AI Summary (No reputation awarded)
                    </h4>
                    <div
                      onClick={() =>
                        handleSelectAiAnswer(
                          query._id,
                          query.aiSynthesizedAnswer,
                        )
                      }
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        sel?.id === null
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-purple-200 bg-purple-50/50 hover:border-purple-400"
                      }`}
                    >
                      {sel?.id === null && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Selected
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0">
                          AI
                        </div>
                        <span className="text-xs font-bold text-purple-700">
                          AI Generated
                        </span>
                        <span className="ml-auto text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                          Synthesized
                        </span>
                      </div>
                      <p className="text-stone-700 text-sm leading-relaxed">
                        {query.aiSynthesizedAnswer}
                      </p>
                      {sel?.id !== null && (
                        <p className="text-[10px] text-purple-600 font-bold mt-2 uppercase tracking-wider">
                          Click to select this AI answer
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contributor Answers */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-bold text-stone-700 flex items-center gap-2 uppercase tracking-wider">
                    <Users className="h-4 w-4 text-stone-400" />
                    Contributor Answers ({query.answers?.length || 0})
                  </h4>

                  {hasAnswers ? (
                    query.answers.map((ans, idx) => {
                      const isSelected = sel?.id === ans._id;
                      return (
                        <div
                          key={ans._id}
                          onClick={() => handleSelectAnswer(query._id, ans)}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-[#0D9488] bg-teal-50 shadow-sm"
                              : "border-stone-200 bg-stone-50 hover:border-teal-300 hover:bg-teal-50/30"
                          }`}
                        >
                          {/* Selected badge */}
                          {isSelected && (
                            <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#0D9488] text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Selected
                            </span>
                          )}

                          {/* Contributor info row */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0">
                              {(ans.contributor?.name || "C").charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-stone-700">
                              {ans.contributor?.name || "Contributor"}
                            </span>
                            {ans.contributor?.reputation !== undefined && (
                              <span className="text-[10px] text-stone-400 font-semibold">
                                ⭐ {ans.contributor.reputation} rep
                              </span>
                            )}
                            <span className="ml-auto text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              Answer {idx + 1}
                            </span>
                          </div>

                          <p className="text-stone-700 text-sm leading-relaxed">
                            {ans.answer}
                          </p>

                          {!isSelected && (
                            <p className="text-[10px] text-teal-600 font-bold mt-2 uppercase tracking-wider">
                              Click to select this answer
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 text-center">
                      <p className="text-sm text-stone-500 italic">
                        No answers submitted by contributors.
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        You can still write a custom answer below and publish
                        it.
                      </p>
                    </div>
                  )}
                </div>

                {/* Reputation reward notice */}
                {sel && sel.id !== null && (
                  <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-amber-500 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    <p className="text-xs font-bold text-amber-800">
                      The selected contributor will earn{" "}
                      <span className="text-amber-600">+10 reputation</span>{" "}
                      when you publish this answer.
                    </p>
                    <button
                      onClick={() => handleUnselectAnswer(query._id)}
                      className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-stone-500 hover:text-red-500 border border-stone-300 hover:border-red-300 rounded-full transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      Unselect
                    </button>
                  </div>
                )}
                {sel && sel.id === null && (
                  <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <Bot className="h-4 w-4 text-purple-500 shrink-0" />
                    <p className="text-xs font-bold text-purple-800">
                      AI answer selected — no reputation will be awarded to any
                      contributor.
                    </p>
                    <button
                      onClick={() => handleUnselectAnswer(query._id)}
                      className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-stone-500 hover:text-red-500 border border-stone-300 hover:border-red-300 rounded-full transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      Unselect
                    </button>
                  </div>
                )}

                {/* Final Answer Editor */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4 text-stone-400" />
                    Final Answer
                    <span className="font-medium text-stone-400 text-[10px] normal-case tracking-normal">
                      (edit before publishing)
                    </span>
                  </h4>
                  <textarea
                    className="w-full bg-white border border-stone-300 rounded-xl p-4 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
                    rows={5}
                    placeholder="Select an answer above or type the final answer here..."
                    value={currentAnswer}
                    onChange={(e) =>
                      setFinalAnswer((prev) => ({
                        ...prev,
                        [query._id]: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Section Selector */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Folder className="h-4 w-4 text-stone-400" />
                    Section
                    <span className="font-medium text-stone-400 text-[10px] normal-case tracking-normal">
                      (where this FAQ will appear)
                    </span>
                  </h4>

                  {/* Show toggle for existing vs new section input */}
                  {!showNewSectionInput[query._id] ? (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
                        value={selectedSection[query._id] || ""}
                        onChange={(e) =>
                          handleSelectSection(query._id, e.target.value || null)
                        }
                      >
                        <option value="">— No section —</option>
                        {sections?.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          setShowNewSectionInput((prev) => ({
                            ...prev,
                            [query._id]: true,
                          }))
                        }
                        className="flex items-center gap-1.5 px-4 py-3 border border-stone-300 hover:border-teal-400 text-stone-600 hover:text-teal-600 rounded-xl text-sm font-bold transition-colors"
                        title="Create new section"
                      >
                        <Plus className="w-4 h-4" />
                        New
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter section title..."
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
                        value={newSectionName[query._id] || ""}
                        onChange={(e) =>
                          setNewSectionName((prev) => ({
                            ...prev,
                            [query._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateNewSection(query._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleCreateNewSection(query._id)}
                        disabled={createSectionMutation.isPending}
                        className="px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        {createSectionMutation.isPending
                          ? "Creating..."
                          : "Add"}
                      </button>
                      <button
                        onClick={() =>
                          setShowNewSectionInput((prev) => ({
                            ...prev,
                            [query._id]: false,
                          }))
                        }
                        className="px-3 py-3 border border-stone-300 text-stone-500 hover:text-red-500 hover:border-red-300 rounded-xl text-sm font-bold transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end items-center">
                  {!currentAnswer?.trim() && (
                    <p className="text-xs text-stone-400 mr-auto">
                      Select or write an answer to publish
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: "Delete Query",
                        message: "Are you sure you want to delete this query? This action cannot be undone.",
                        onConfirm: () => deleteQueryMutation.mutate(query._id),
                      });
                    }}
                    disabled={deleteQueryMutation.isPending || publishQueryMutation.isPending}
                    className="px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className={`w-4 h-4 ${deleteQueryMutation.isPending ? "animate-spin" : ""}`} />
                    {deleteQueryMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() =>
                      publishQueryMutation.mutate({
                        id: query._id,
                        data: {
                          answer: currentAnswer,
                          responseId: sel?.id ?? undefined,
                          sectionId: selectedSection[query._id] || undefined,
                        },
                      })
                    }
                    disabled={
                      publishQueryMutation.isPending ||
                      deleteQueryMutation.isPending ||
                      !currentAnswer?.trim() ||
                      !selectedSection[query._id]
                    }
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {publishQueryMutation.isPending ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        PUBLISHING...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        PUBLISH AS FAQ
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 2: Flagged & Removed Queries */}
      <div className="mb-6 border-b border-stone-100 pb-3 mt-12 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-display tracking-tight">
            Flagged & Removed
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Queries that were flagged and removed from the live feed — restore or publish as FAQ
          </p>
        </div>
      </div>

      {rejectedLoading ? (
        <RejectedQueriesSkeleton />
      ) : rejectedQueries?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 rounded-3xl bg-white shadow-sm">
          <Flag className="w-12 h-12 text-stone-300 mb-4" />
          <p className="text-stone-600 font-semibold text-lg font-display tracking-tight">
            No flagged queries.
          </p>
          <p className="text-stone-400 text-sm mt-1">
            Queries flagged by users will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 mb-12">
          {rejectedQueries?.map((query) => {
            const rejectedAnswer = finalAnswer[query._id] || "";
            const rejectedSection = selectedSection[query._id] || "";

            return (
              <div
                key={query._id}
                className="bg-white border border-orange-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="flex gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {query.category}
                  </span>
                  <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    Flagged
                  </span>
                  {query.flagCount && (
                    <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {query.flagCount} flags
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-stone-900 mb-4 font-display tracking-tight leading-snug">
                  {query.question}
                </h3>

                {query.flaggedBy && query.flaggedBy.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-800">
                      Flagged by {query.flaggedBy.length} user{query.flaggedBy.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Contributor Answers (if any) */}
                {query.answers && query.answers.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-bold text-stone-700 flex items-center gap-2 uppercase tracking-wider">
                      <Users className="h-4 w-4 text-stone-400" />
                      Contributor Answers ({query.answers.length})
                    </h4>
                    {query.answers.map((ans, idx) => {
                      const isSelected = selectedResponse[query._id]?.id === ans._id;
                      return (
                        <div
                          key={ans._id}
                          onClick={() => {
                            setSelectedResponse((prev) => ({
                              ...prev,
                              [query._id]: { id: ans._id, answer: ans.answer },
                            }));
                            setFinalAnswer((prev) => ({
                              ...prev,
                              [query._id]: ans.answer,
                            }));
                          }}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-[#0D9488] bg-teal-50 shadow-sm"
                              : "border-stone-200 bg-stone-50 hover:border-teal-300 hover:bg-teal-50/30"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#0D9488] text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Selected
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0">
                              {(ans.contributor?.name || "C").charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-stone-700">
                              {ans.contributor?.name || "Contributor"}
                            </span>
                            <span className="ml-auto text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              Answer {idx + 1}
                            </span>
                          </div>
                          <p className="text-stone-700 text-sm leading-relaxed">
                            {ans.answer}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer Editor */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4 text-stone-400" />
                    Final Answer
                    <span className="font-medium text-stone-400 text-[10px] normal-case tracking-normal">
                      (edit before publishing)
                    </span>
                  </h4>
                  <textarea
                    className="w-full bg-white border border-stone-300 rounded-xl p-4 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
                    rows={4}
                    placeholder="Write or edit the answer here..."
                    value={rejectedAnswer}
                    onChange={(e) =>
                      setFinalAnswer((prev) => ({
                        ...prev,
                        [query._id]: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Section Selector */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Folder className="h-4 w-4 text-stone-400" />
                    Section
                    <span className="font-medium text-stone-400 text-[10px] normal-case tracking-normal">
                      (required for publishing)
                    </span>
                  </h4>
                  {!showNewSectionInput[query._id] ? (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
                        value={rejectedSection}
                        onChange={(e) =>
                          handleSelectSection(query._id, e.target.value || null)
                        }
                      >
                        <option value="">— No section —</option>
                        {sections?.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          setShowNewSectionInput((prev) => ({
                            ...prev,
                            [query._id]: true,
                          }))
                        }
                        className="flex items-center gap-1.5 px-4 py-3 border border-stone-300 hover:border-teal-400 text-stone-600 hover:text-teal-600 rounded-xl text-sm font-bold transition-colors"
                        title="Create new section"
                      >
                        <Plus className="w-4 h-4" />
                        New
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter section title..."
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
                        value={newSectionName[query._id] || ""}
                        onChange={(e) =>
                          setNewSectionName((prev) => ({
                            ...prev,
                            [query._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateNewSection(query._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleCreateNewSection(query._id)}
                        disabled={createSectionMutation.isPending}
                        className="px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        {createSectionMutation.isPending ? "Creating..." : "Add"}
                      </button>
                      <button
                        onClick={() =>
                          setShowNewSectionInput((prev) => ({
                            ...prev,
                            [query._id]: false,
                          }))
                        }
                        className="px-3 py-3 border border-stone-300 text-stone-500 hover:text-red-500 hover:border-red-300 rounded-xl text-sm font-bold transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end items-center">
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: "Delete Query",
                        message: "Are you sure you want to delete this query? This action cannot be undone.",
                        onConfirm: () => deleteQueryMutation.mutate(query._id),
                      });
                    }}
                    disabled={
                      deleteQueryMutation.isPending ||
                      restoreQueryMutation.isPending ||
                      publishQueryMutation.isPending
                    }
                    className="px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className={`w-4 h-4 ${deleteQueryMutation.isPending ? "animate-spin" : ""}`} />
                    {deleteQueryMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() => restoreQueryMutation.mutate(query._id)}
                    disabled={
                      restoreQueryMutation.isPending ||
                      publishQueryMutation.isPending ||
                      deleteQueryMutation.isPending
                    }
                    className="px-4 py-2.5 border border-orange-300 hover:bg-orange-50 text-orange-600 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <RotateCcw className={`w-4 h-4 ${restoreQueryMutation.isPending ? "animate-spin" : ""}`} />
                    {restoreQueryMutation.isPending ? "Restoring..." : "Restore to Feed"}
                  </button>
                  <button
                    onClick={() =>
                      publishQueryMutation.mutate({
                        id: query._id,
                        data: {
                          answer: rejectedAnswer,
                          responseId: selectedResponse[query._id]?.id ?? undefined,
                          sectionId: selectedSection[query._id] || undefined,
                        },
                      })
                    }
                    disabled={
                      publishQueryMutation.isPending ||
                      restoreQueryMutation.isPending ||
                      deleteQueryMutation.isPending ||
                      !rejectedAnswer?.trim() ||
                      !rejectedSection
                    }
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {publishQueryMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        PUBLISHING...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        PUBLISH AS FAQ
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}



      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Add FAQ Modal */}
      <Modal
        isOpen={showAddFaq}
        onClose={() => setShowAddFaq(false)}
        title="Add New FAQ"
        size="lg"
      >
        <form onSubmit={handleAddFaqSubmit} className="space-y-6">
          <p className="text-sm text-stone-400 -mt-2">
            Fill in the details below to create and publish a new FAQ entry.
          </p>

          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-teal-400 mb-2">
                Question / Title <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  minLength={10}
                  maxLength={300}
                  placeholder="Type the FAQ question here..."
                  className="w-full bg-white/90 border border-white/30 rounded-xl px-4 py-3 pl-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400/50 transition-all shadow-sm"
                  value={addFaqForm.title}
                  onChange={(e) => setAddFaqForm((p) => ({ ...p, title: e.target.value }))}
                />
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black ${addFaqForm.title.length >= 10 ? "text-teal-500" : "text-stone-400"}`}>
                  Q
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-stone-500">Min 10 characters</span>
                <span className={`text-[10px] font-mono ${addFaqForm.title.length > 250 ? "text-amber-500" : "text-stone-400"}`}>
                  {addFaqForm.title.length}/300
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-teal-400 mb-2">
                Answer <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <textarea
                  required
                  minLength={20}
                  rows={5}
                  placeholder="Write a clear, detailed answer..."
                  className="w-full bg-white/90 border border-white/30 rounded-xl px-4 py-3 pl-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400/50 transition-all shadow-sm resize-none"
                  value={addFaqForm.answer}
                  onChange={(e) => setAddFaqForm((p) => ({ ...p, answer: e.target.value }))}
                />
                <span className={`absolute left-3 top-3.5 text-xs font-black ${addFaqForm.answer.length >= 20 ? "text-teal-500" : "text-stone-400"}`}>
                  A
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-stone-500">Min 20 characters</span>
                <span className={`text-[10px] font-mono ${addFaqForm.answer.length > 250 ? "text-amber-500" : "text-stone-400"}`}>
                  {addFaqForm.answer.length}/10000
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal-400 mb-2">
                  Section <span className="text-red-400">*</span>
                </label>
                {!showFaqNewSectionInput ? (
                  <div className="flex gap-2">
                    <select
                      required
                      className="flex-1 bg-white/90 border border-white/30 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400/50 transition-all shadow-sm cursor-pointer appearance-none"
                      value={addFaqForm.sectionId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__new__") {
                          setShowFaqNewSectionInput(true);
                        } else {
                          setAddFaqForm((p) => ({ ...p, sectionId: val }));
                        }
                      }}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23757575' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                    >
                      <option value="">— Select section —</option>
                      {sections?.map((s) => (
                        <option key={s._id} value={s._id}>{s.title}</option>
                      ))}
                      <option value="__new__">+ Create new section</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowFaqNewSectionInput(true)}
                      className="px-3 py-2.5 bg-white/60 hover:bg-white/80 border border-white/30 rounded-xl text-xs font-bold text-teal-600 transition-all"
                      title="Create new section"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter section name..."
                      autoFocus
                      className="flex-1 bg-white/90 border border-teal-400/50 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400/50 transition-all shadow-sm"
                      value={faqNewSectionName}
                      onChange={(e) => setFaqNewSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (faqNewSectionName.trim()) createFaqSectionMutation.mutate(faqNewSectionName.trim());
                        }
                        if (e.key === "Escape") {
                          setShowFaqNewSectionInput(false);
                          setFaqNewSectionName("");
                        }
                      }}
                    />
                    <button
                      type="button"
onClick={() => {
                          if (faqNewSectionName.trim()) createFaqSectionMutation.mutate(faqNewSectionName.trim());
                        }}
                        disabled={!faqNewSectionName.trim() || createFaqSectionMutation.isPending}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      {createFaqSectionMutation.isPending ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
onClick={() => {
                          setShowFaqNewSectionInput(false);
                          setFaqNewSectionName("");
                        }}
                      className="px-3 py-2.5 border border-white/30 hover:bg-white/20 text-stone-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-2">
              Tags <span className="text-stone-500 normal-case font-medium tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. interview, coding, python — comma separated"
              className="w-full bg-white/70 border border-white/30 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400/50 transition-all shadow-sm"
              value={addFaqForm.tags}
              onChange={(e) => setAddFaqForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddFaq(false)}
              className="px-5 py-2.5 border border-white/30 hover:bg-white/20 text-stone-300 hover:text-white rounded-xl text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createDirectFaqMutation.isPending ||
                !addFaqForm.title.trim() ||
                !addFaqForm.answer.trim() ||
                !addFaqForm.sectionId
              }
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {createDirectFaqMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Create & Publish
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
