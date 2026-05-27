import { create } from 'zustand';

export const useFeedStore = create((set) => ({
  queries: [],
  isConnected: false,

  setConnected: (status) => set({ isConnected: status }),

  addQuery: (query) =>
    set((state) => ({
      queries: [query, ...state.queries].slice(0, 100), // cap at 100 entries
    })),

  updateQuery: (queryId, updates) =>
    set((state) => ({
      queries: state.queries.map((q) =>
        q.queryId === queryId || q._id === queryId ? { ...q, ...updates } : q
      ),
    })),

  removeQuery: (queryId) =>
    set((state) => ({
      queries: state.queries.filter((q) => q.queryId !== queryId && q._id !== queryId),
    })),

  setQueries: (queries) => set({ queries }),
}));
