import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { faqService, queryService } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const querySchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question is too long"),
});

const AskQueryPage = () => {
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(querySchema),
  });

  const questionValue = watch("question");

  const checkDuplicate = async () => {
    if (!questionValue || questionValue.length < 10) return;
    setIsChecking(true);
    try {
      const res = await faqService.resolve(questionValue);
      setDuplicateCheckResult(res.data.data); // data could be an FAQ or null
    } catch (err) {
      // ignore
      setDuplicateCheckResult(null);
    } finally {
      setIsChecking(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: (data) => queryService.submit(data.question),
    onSuccess: () => {
      toast.success("Query submitted successfully! Contributors are on it.");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit query");
    },
  });

  const onSubmit = (data) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
          Ask a Question
        </h1>
        <p className="text-stone-500">
          Get fast, accurate answers from expert contributors.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Your Question
          </label>
          <textarea
            {...register("question")}
            rows={4}
            onBlur={checkDuplicate}
            className={`input-field rounded-2xl px-4 py-3 min-h-[140px] resize-none ${errors.question ? "border-red-500" : "border-stone-200"}`}
            placeholder="e.g., How does the consensus algorithm ensure accuracy?"
          />
          {errors.question && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.question.message}
            </p>
          )}
        </div>

        {isChecking && (
          <p className="text-sm text-stone-500 italic animate-pulse">
            Checking for existing answers...
          </p>
        )}

        {duplicateCheckResult && duplicateCheckResult.faq && (
          <div className="p-5 bg-teal-50 border border-teal-100 rounded-xl">
            <p className="text-sm font-bold text-teal-800 mb-2">
              We found an existing answer for you!
            </p>
            <h4 className="text-lg font-bold text-teal-900 mb-1">
              {duplicateCheckResult.faq.title}
            </h4>
            <p className="text-teal-800 text-sm">
              {duplicateCheckResult.faq.answer}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitMutation.isPending || isChecking}
          className="px-6 py-3 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl font-extrabold tracking-wider transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitMutation.isPending ? "SUBMITTING..." : "SUBMIT QUERY"}
        </button>
      </form>
    </div>
  );
};

export default AskQueryPage;
