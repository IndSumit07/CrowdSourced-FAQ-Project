import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contributorService } from "../../services/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

const answerSchema = z.object({
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  confidence: z.number().min(1).max(5).default(5),
});

const ContributorDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedQuery, setSelectedQuery] = useState(null);

  const {
    data: responses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-responses"],
    queryFn: async () => {
      const res = await contributorService.myResponses();
      const payload = res.data.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.responses)) return payload.responses;
      if (Array.isArray(payload?.docs)) return payload.docs;
      return [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(answerSchema),
  });

  const answerMutation = useMutation({
    mutationFn: (data) => contributorService.answer(selectedQuery._id, data),
    onSuccess: () => {
      toast.success("Answer submitted successfully!");
      setSelectedQuery(null);
      reset();
      queryClient.invalidateQueries(["my-responses"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit answer");
    },
  });

  const onSubmitAnswer = (data) => {
    answerMutation.mutate(data);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
          Contributor Hub
        </h1>
        <p className="text-stone-500">
          Manage your accepted queries and submit answers
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">
          Failed to load your responses.
        </div>
      ) : responses?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-300 rounded-3xl bg-stone-50">
          <p className="text-stone-500 font-medium">
            You haven't accepted any queries yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {responses?.map((resp) => {
            const q = resp.query || resp; // Fallback if populated differently
            return (
              <div
                key={resp._id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                      resp.answer
                        ? "bg-teal-100 text-teal-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {resp.answer ? "Answered" : "Pending Answer"}
                  </span>
                  <span className="text-xs text-stone-400 font-bold">
                    {new Date(resp.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-stone-900 font-bold mb-4">{q.question}</h3>

                {resp.answer ? (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {resp.answer}
                    </p>
                    <div className="mt-2 text-xs font-bold text-[#0D9488]">
                      Confidence: {resp.confidence}/5
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedQuery(q)}
                    className="px-5 py-2 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl text-sm font-extrabold tracking-wider transition-colors shadow-sm"
                  >
                    PROVIDE ANSWER
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Answer Modal */}
      <Modal
        isOpen={!!selectedQuery}
        onClose={() => setSelectedQuery(null)}
        title="Submit Your Answer"
      >
        <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <p className="text-stone-900 font-bold">{selectedQuery?.question}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmitAnswer)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              Your Answer
            </label>
            <textarea
              {...register("answer")}
              rows={5}
              className={`input-field rounded-xl px-4 py-3 min-h-40 resize-none ${errors.answer ? "border-red-500" : "border-stone-200"}`}
              placeholder="Type your comprehensive answer here..."
            />
            {errors.answer && (
              <p className="text-red-400 text-xs mt-1">
                {errors.answer.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              Confidence Score (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              {...register("confidence", { valueAsNumber: true })}
              className={`input-field rounded-xl px-4 py-3 ${errors.confidence ? "border-red-500" : "border-stone-200"}`}
            />
            {errors.confidence && (
              <p className="text-red-400 text-xs mt-1">
                {errors.confidence.message}
              </p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={answerMutation.isPending}
              className="w-full py-3 bg-[#B45309] hover:bg-amber-800 text-white rounded-xl font-bold transition-colors disabled:opacity-70"
            >
              {answerMutation.isPending ? "SUBMITTING..." : "SUBMIT ANSWER"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContributorDashboard;
