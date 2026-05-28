import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryService } from "../../services/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const queryClient = useQueryClient();
  const {
    data: queries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-queries"],
    queryFn: async () => {
      const res = await queryService.getMyQueries();
      const payload = res.data.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.docs)) return payload.docs;
      return [];
    },
  });

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

  const formatResolutionTime = (createdAt, resolvedAt) => {
    if (!createdAt || !resolvedAt) return null;
    const diffMs = new Date(resolvedAt) - new Date(createdAt);
    if (Number.isNaN(diffMs) || diffMs <= 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
          My Queries
        </h1>
        <p className="text-stone-500">
          Track the status of the questions you've asked
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">
          Failed to load your queries.
        </div>
      ) : queries?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-300 rounded-3xl bg-stone-50">
          <p className="text-stone-500 font-medium mb-4">
            You haven't asked any questions yet.
          </p>
          <Link
            to="/ask"
            className="px-6 py-2.5 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors inline-block"
          >
            ASK A QUESTION
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedQueries).map(([topic, items]) => (
            <section key={topic} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-stone-900 tracking-tight">
                    {topic}
                  </h2>
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                    {items.length} queries
                  </p>
                </div>
                <div className="h-px flex-1 mx-4 bg-stone-200"></div>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  Topic
                </span>
              </div>

              <div className="grid gap-4">
                {items.map((q) => (
                  <div
                    key={q._id}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
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
                        <span className="text-xs text-stone-400 font-bold">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-stone-900 font-bold line-clamp-2">
                        {q.question}
                      </h3>
                      {q.status === "completed" &&
                        q.resolvedAnswer &&
                        (() => {
                          const resolvedDuration = formatResolutionTime(
                            q.createdAt,
                            q.resolvedAt,
                          );
                          return (
                            <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-600/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                                  Resolved
                                </span>
                                {resolvedDuration && (
                                  <span className="text-[11px] font-bold text-teal-700">
                                    Resolved in {resolvedDuration}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-stone-700 leading-relaxed">
                                {q.resolvedAnswer}
                              </p>
                            </div>
                          );
                        })()}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className="block text-xl font-black text-stone-900">
                          {q.responseCount || 0}
                        </span>
                        <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">
                          Responses
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(q._id)}
                        disabled={["processing", "completed"].includes(
                          q.status,
                        )}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors border ${
                          ["processing", "completed"].includes(q.status)
                            ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                            : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
