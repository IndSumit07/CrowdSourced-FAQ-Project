import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import SiteHeader from "../../components/layout/SiteHeader";
import { useGoogleLogin } from "@react-oauth/google";

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
  const googleLogin = useAuthStore((state) => state.googleLogin);
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

  // Google sign-up uses the same flow as Google sign-in (find-or-create on backend)
  const handleGoogleSignUp = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await googleLogin(tokenResponse.access_token);
      if (res.success) {
        toast.success("Account created with Google!");
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Google sign-up failed");
      }
    },
    onError: () => {
      toast.error("Google sign-up was cancelled or failed.");
    },
  });

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

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={() => handleGoogleSignUp()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-stone-200 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">
              or sign up with email
            </span>
            <div className="flex-1 h-px bg-stone-200" />
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
