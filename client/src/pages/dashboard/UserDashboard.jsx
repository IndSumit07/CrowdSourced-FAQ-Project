import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryService, faqService } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Skeleton } from "../../components/ui/Skeleton";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [openFaqIds, setOpenFaqIds] = useState(() => new Set());

  const {
    data: queries,
    isLoading: queriesLoading,
    error: queriesError,
  } = useQuery({
    queryKey: ["my-queries"],
    queryFn: async () => {
      const res = await queryService.getMyQueries();
      const payload = res.data.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.docs)) return payload.docs;
      return [];
    },
    enabled: isAuthenticated,
  });

  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ["user-dashboard-faqs"],
    queryFn: async () => {
      const res = await faqService.getAll({ page: 1, limit: 50 });
      return res.data.data.docs || res.data.data || [];
    },
  });

  const toggleFaqOpen = (id) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => queryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-queries"]);
    },
    onError: (err) => {
      const message = err.response?.data?.message || "Failed to delete query";
      window.alert(message);
    },
  });

  const handleDelete = (queryId) => {
    const confirmed = window.confirm(
      "Delete this query? This cannot be undone.",
    );
    if (!confirmed) return;
    deleteMutation.mutate(queryId);
  };

  const groupedQueries = (queries || []).reduce((acc, query) => {
    const key = query.category || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(query);
    return acc;
  }, {});

  return (
    <div className="w-full space-y-12">
      {/* FAQs Section - on top */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Knowledge Base
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Browse community-curated FAQs
            </p>
          </div>
          <Link
            to="/faqs"
            className="text-xs font-extrabold text-teal-600 hover:text-teal-800 uppercase tracking-wider"
          >
            View all →
          </Link>
        </div>

        {faqsLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : faqs?.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-stone-300 rounded-2xl bg-stone-50">
            <p className="text-stone-500 text-sm">No FAQs yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {(faqs || []).slice(0, 10).map((faq) => {
              const isOpen = openFaqIds.has(faq._id);
              return (
                <div
                  key={faq._id}
                  className="bg-white border border-stone-200 rounded-xl shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaqOpen(faq._id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-bold text-stone-900 line-clamp-1">
                      {faq.title}
                    </span>
                    <span
                      className={`text-stone-400 text-lg transition-transform shrink-0 ${isOpen ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-stone-600 leading-relaxed">
                        {faq.answer}
                      </p>
                      {faq.section && (
                        <span className="inline-block mt-2 px-2 py-1 bg-stone-100 text-stone-500 rounded-md text-[10px] font-bold uppercase">
                          {typeof faq.section === "object" ? faq.section.title : faq.section}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My Queries Section - below FAQs */}
      <section>
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            My Queries
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track the status of the questions you've asked
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-10 border border-dashed border-stone-300 rounded-2xl bg-stone-50">
            <p className="text-stone-500 text-sm font-medium mb-1">
              Want to ask a question?
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <Link
                to="/login"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold tracking-wider transition-colors"
              >
                Login
              </Link>
              <span className="text-stone-400 text-xs">or</span>
              <Link
                to="/register"
                className="px-4 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-lg text-xs font-extrabold tracking-wider transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        ) : queriesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : queriesError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            Failed to load your queries.
          </div>
        ) : queries?.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-stone-300 rounded-2xl bg-stone-50">
            <p className="text-stone-500 text-sm font-medium mb-3">
              You haven't asked any questions yet.
            </p>
            <Link
              to="/ask"
              className="px-5 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-xl text-xs font-extrabold tracking-wider transition-colors inline-block"
            >
              Ask a Question
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedQueries).map(([topic, items]) => (
              <div key={topic} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-extrabold text-stone-500 uppercase tracking-wider">
                    {topic}
                  </h3>
                  <div className="h-px flex-1 bg-stone-200"></div>
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase">
                    {items.length}
                  </span>
                </div>

                {items.map((q) => (
                  <div
                    key={q._id}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                            q.status === "completed"
                              ? "bg-teal-100 text-teal-800"
                              : q.status === "processing"
                                ? "bg-blue-100 text-blue-800"
                                : q.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {q.status}
                        </span>
                        <span className="text-[11px] text-stone-400 font-bold">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(q._id)}
                        disabled={["processing", "completed"].includes(q.status)}
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg border transition-colors ${
                          ["processing", "completed"].includes(q.status)
                            ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                            : "text-red-700 border-red-200 hover:bg-red-50"
                        }`}
                      >
                        Delete
                      </button>
                    </div>

                    <p className="text-sm font-bold text-stone-900 mb-2">
                      {q.question}
                    </p>

                    {q.status === "completed" && q.resolvedAnswer && (
                      <div className="mt-2 rounded-lg border border-teal-200 bg-teal-50/60 p-3">
                        <p className="text-xs font-extrabold text-teal-700 mb-1 uppercase tracking-wider">
                          Answer
                        </p>
                        <p className="text-sm text-stone-700 leading-relaxed">
                          {q.resolvedAnswer}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 text-center">
                      <span className="text-xs font-bold text-stone-400">
                        {q.responseCount || 0} responses
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserDashboard;
