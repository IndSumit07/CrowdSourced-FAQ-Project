import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await adminService.getStats();
      // getDashboardStats returns { stats: { faqs: {...}, queries: {...} } }
      const payload = res.data.data;
      return payload.stats ?? payload;
    },
  });

  const { data: pendingFAQs, isLoading: faqsLoading } = useQuery({
    queryKey: ['pending-faqs'],
    queryFn: async () => {
      const res = await adminService.getPendingFAQs();
      // Server returns { faqs: [...], total: N } — extract the array
      const payload = res.data.data;
      return Array.isArray(payload) ? payload : (payload.faqs ?? []);
    },
  });

  const { data: pendingQueries, isLoading: queriesLoading } = useQuery({
    queryKey: ['pending-review-queries'],
    queryFn: async () => {
      const res = await adminService.getPendingReviewQueries();
      const payload = res.data.data;
      return Array.isArray(payload) ? payload : (payload.queries ?? []);
    },
  });

  const [selectedAnswer, setSelectedAnswer] = useState({});

  const publishQueryMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.publishQueryToFAQ(id, data),
    onSuccess: () => {
      toast.success('Query Published as FAQ successfully!');
      queryClient.invalidateQueries({ queryKey: ['pending-review-queries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to publish query'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminService.approveFAQ(id),
    onSuccess: () => {
      toast.success('FAQ Published successfully!');
      queryClient.invalidateQueries(['pending-faqs']);
      queryClient.invalidateQueries(['admin-stats']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve FAQ'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminService.rejectFAQ(id, 'Admin rejected draft'),
    onSuccess: () => {
      toast.success('FAQ Draft rejected.');
      queryClient.invalidateQueries(['pending-faqs']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject FAQ'),
  });

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">Admin Dashboard</h1>
        <p className="text-stone-500">Platform overview and content moderation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : (
          <>
            <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">Total Users</p>
              {/* server: stats = { faqs: { total, published, pending }, queries: { open, ... } } */}
              <p className="text-3xl font-black">{stats?.users?.total ?? stats?.totalUsers ?? '—'}</p>
            </div>
            <div className="bg-[#B45309] text-white p-5 rounded-2xl shadow-sm">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Total Queries</p>
              <p className="text-3xl font-black">
                {Object.values(stats?.queries ?? {}).reduce((a, b) => a + b, 0) || stats?.totalQueries || '—'}
              </p>
            </div>
            <div className="bg-[#0D9488] text-white p-5 rounded-2xl shadow-sm">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Published FAQs</p>
              <p className="text-3xl font-black">{stats?.faqs?.published ?? stats?.publishedFaqs ?? '—'}</p>
            </div>
            <div className="bg-white border border-stone-200 text-stone-900 p-5 rounded-2xl shadow-sm">
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Review</p>
              <p className="text-3xl font-black text-red-500">
                {stats?.faqs?.pending ?? pendingFAQs?.length ?? '—'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Pending Review Queries section */}
      <div className="mb-6 mt-12 border-b border-stone-200 pb-2">
        <h2 className="text-xl font-bold text-stone-900">Pending Review (Expired Queries)</h2>
        <p className="text-sm text-stone-500">Review answers, edit, and publish to main FAQ database</p>
      </div>

      {queriesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : pendingQueries?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-300 rounded-3xl bg-stone-50">
          <p className="text-stone-500 font-medium">No expired queries pending review.</p>
        </div>
      ) : (
        <div className="grid gap-6 mb-12">
          {pendingQueries?.map((query) => (
            <div key={query._id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase">
                  {query.category}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-stone-900 mb-4">{query.question}</h3>
              
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-bold text-stone-700">Contributor Answers ({query.answers?.length || 0})</h4>
                {query.answers?.length > 0 ? (
                  query.answers.map((ans, idx) => (
                    <div key={ans._id} className="bg-stone-50 p-4 rounded-xl border border-stone-200 cursor-pointer hover:border-[#0D9488] transition-colors"
                         onClick={() => setSelectedAnswer({ ...selectedAnswer, [query._id]: ans.answer })}>
                      <p className="text-xs text-stone-500 mb-1 font-bold">Answer {idx + 1} (Click to select)</p>
                      <p className="text-stone-700 text-sm leading-relaxed">{ans.answer}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500 italic">No answers provided by contributors.</p>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-stone-700 mb-2">Final Answer (Edit before publishing)</h4>
                <textarea
                  className="w-full bg-white border border-stone-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  rows={4}
                  placeholder="Select an answer above or type the final answer here..."
                  value={selectedAnswer[query._id] || ''}
                  onChange={(e) => setSelectedAnswer({ ...selectedAnswer, [query._id]: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => publishQueryMutation.mutate({ id: query._id, data: { answer: selectedAnswer[query._id] } })}
                  disabled={publishQueryMutation.isPending || !selectedAnswer[query._id]?.trim()}
                  className="px-5 py-2 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm disabled:opacity-50"
                >
                  PUBLISH AS FAQ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending FAQs section */}
      <div className="mb-6 border-b border-stone-200 pb-2">
        <h2 className="text-xl font-bold text-stone-900">Pending Approvals (AI Generated)</h2>
      </div>

      {faqsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : pendingFAQs?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-300 rounded-3xl bg-stone-50">
          <p className="text-stone-500 font-medium">All caught up! No pending FAQs to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingFAQs?.map((faq) => (
            <div key={faq._id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-2 mb-3">
                {faq.tags?.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase">
                    {tag}
                  </span>
                ))}
              </div>
              
              <h3 className="text-lg font-bold text-stone-900 mb-2">{faq.title}</h3>
              <div className="bg-[#FAF6F0] p-4 rounded-xl border border-stone-200 mb-6">
                <p className="text-stone-700 text-sm leading-relaxed">{faq.answer}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => rejectMutation.mutate(faq._id)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  className="px-5 py-2 border border-stone-200 hover:bg-red-50 text-stone-600 hover:text-red-600 rounded-xl text-sm font-extrabold tracking-wider transition-colors disabled:opacity-50"
                >
                  REJECT
                </button>
                <button 
                  onClick={() => approveMutation.mutate(faq._id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="px-5 py-2 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm disabled:opacity-50"
                >
                  APPROVE & PUBLISH
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
