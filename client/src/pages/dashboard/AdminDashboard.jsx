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
      return res.data.data;
    },
  });

  const { data: pendingFAQs, isLoading: faqsLoading } = useQuery({
    queryKey: ['pending-faqs'],
    queryFn: async () => {
      const res = await adminService.getPendingFAQs();
      return res.data.data.docs || res.data.data;
    },
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
              <p className="text-3xl font-black">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-[#B45309] text-white p-5 rounded-2xl shadow-sm">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Total Queries</p>
              <p className="text-3xl font-black">{stats?.totalQueries || 0}</p>
            </div>
            <div className="bg-[#0D9488] text-white p-5 rounded-2xl shadow-sm">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Published FAQs</p>
              <p className="text-3xl font-black">{stats?.publishedFaqs || 0}</p>
            </div>
            <div className="bg-white border border-stone-200 text-stone-900 p-5 rounded-2xl shadow-sm">
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Review</p>
              <p className="text-3xl font-black text-red-500">{stats?.pendingFaqs || pendingFAQs?.length || 0}</p>
            </div>
          </>
        )}
      </div>

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
