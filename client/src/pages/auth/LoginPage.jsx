import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const res = await login(data);
    if (res.success) {
      toast.success("Welcome back!");
      const from = location.state?.redirectTo || "/dashboard";
      navigate(from, { state: location.state, replace: true });
    } else {
      toast.error(res.message || "Login failed");
    }
  };

  // useGoogleLogin uses the Authorization Code / token flow via popup
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await googleLogin(tokenResponse.access_token);
      if (res.success) {
        toast.success("Welcome back!");
        const from = location.state?.redirectTo || "/dashboard";
        navigate(from, { state: location.state, replace: true });
      } else {
        toast.error(res.message || "Google sign-in failed");
      }
    },
    onError: () => {
      toast.error("Google sign-in was cancelled or failed.");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] p-4 relative">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
              Welcome Back
            </h1>
            <p className="text-stone-500">Sign in to continue your journey</p>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
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
              or sign in with email
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-stone-900 hover:bg-[#B45309] text-white rounded-xl font-extrabold tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <p className="text-center text-stone-500 text-sm mt-6 font-medium">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#B45309] hover:underline font-bold"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
