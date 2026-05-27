import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import SiteHeader from "../../components/layout/SiteHeader";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const RegisterPage = () => {
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");
  const passwordChecks = {
    length: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
  };
  const passedCount = Object.values(passwordChecks).filter(Boolean).length;
  const strengthPercent = (passedCount / 3) * 100;
  const canSubmit = isValid && passedCount === 3;
  const strengthColor =
    passedCount <= 1
      ? "bg-red-500"
      : passedCount === 2
        ? "bg-amber-500"
        : "bg-teal-600";

  const onSubmit = async (data) => {
    const res = await registerUser(data);
    if (res.success) {
      toast.success("Registration successful!");
      navigate("/dashboard");
    } else {
      toast.error(res.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] p-4 relative py-20">
      <SiteHeader />
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden mt-12 relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
              Create Account
            </h1>
            <p className="text-stone-500">Join the QueryCare community</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                {...register("name")}
                className={`input-field rounded-xl px-4 py-3 ${errors.name ? "border-red-500" : "border-stone-200"}`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className={`input-field rounded-xl px-4 py-3 ${errors.email ? "border-red-500" : "border-stone-200"}`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                className={`input-field rounded-xl px-4 py-3 ${errors.password ? "border-red-500" : "border-stone-200"}`}
                placeholder="••••••••"
              />
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${strengthPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 text-xs text-stone-600 font-medium flex flex-wrap gap-x-3 gap-y-1">
                  <span
                    className={
                      passwordChecks.length ? "text-teal-700" : "text-stone-400"
                    }
                  >
                    8+ chars
                  </span>
                  <span
                    className={
                      passwordChecks.uppercase
                        ? "text-teal-700"
                        : "text-stone-400"
                    }
                  >
                    1 uppercase
                  </span>
                  <span
                    className={
                      passwordChecks.number ? "text-teal-700" : "text-stone-400"
                    }
                  >
                    1 number
                  </span>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full py-3.5 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl font-extrabold tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
            </button>
          </form>

          <p className="text-center text-stone-500 text-sm mt-6 font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#0D9488] hover:underline font-bold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
