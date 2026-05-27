import { useEffect } from "react";
import { useFeedStore } from "../store/feedStore";
import { queryService, contributorService } from "../services/api";
import { CountdownTimer } from "../components/ui/CountdownTimer";
import toast from "react-hot-toast";

const LiveContributorFeed = () => {
  const { queries, setQueries } = useFeedStore();

  useEffect(() => {
    // Initial fetch of active queries
    const fetchFeed = async () => {
      try {
        const res = await queryService.getFeed({ status: "open" });
        setQueries(res.data.data.docs || res.data.data);
      } catch (err) {
        toast.error("Failed to load feed");
      }
    };
    fetchFeed();
  }, [setQueries]);

  const handleAccept = async (queryId) => {
    try {
      await contributorService.accept(queryId);
      toast.success("Query accepted! You can now provide an answer.");
      // The socket event CONTRIBUTOR_ACCEPTED might fire, or we just rely on optimistic UI/refetch
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept query");
    }
  };

  const groupedQueries = queries.reduce((acc, query) => {
    const key = query.category || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(query);
    return acc;
  }, {});

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
            Live Feed
          </h1>
          <p className="text-stone-500 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B45309] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B45309]"></span>
            </span>
            Real-time queries needing your expertise
          </p>
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-stone-300 rounded-3xl bg-stone-50">
          <p className="text-stone-500 font-medium">
            No open queries at the moment.
          </p>
          <p className="text-stone-400 text-sm mt-1">
            Waiting for new questions...
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedQueries).map(([topic, items]) => (
            <section key={topic} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-stone-900 tracking-tight">
                    {topic}
                  </h2>
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                    {items.length} open queries
                  </p>
                </div>
                <div className="h-px flex-1 mx-4 bg-stone-200"></div>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  Topic
                </span>
              </div>

              <div className="grid gap-6">
                {items.map((q) => (
                  <div
                    key={q._id || q.queryId}
                    className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#0D9488]"></div>

                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {q.category || "General"}
                      </span>
                      {q.deadline && (
                        <CountdownTimer deadline={q.deadline} compact />
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 mb-6">
                      {q.question}
                    </h3>

                    <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                      <div className="flex items-center gap-4 text-sm font-bold text-stone-500">
                        <span>{q.responseCount || 0} Responses</span>
                        <span>•</span>
                        <span>
                          {q.acceptedContributors?.length || 0} Contributors
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(q._id || q.queryId)}
                          className="px-5 py-2 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm"
                        >
                          ACCEPT
                        </button>
                      </div>
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

export default LiveContributorFeed;
