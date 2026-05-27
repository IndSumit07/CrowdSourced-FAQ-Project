import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import SiteHeader from "../../components/layout/SiteHeader";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const login = useAuthStore((state) => state.login);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] p-4 relative">
      <SiteHeader />
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden mt-16 relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-2">
              Welcome Back
            </h1>
            <p className="text-stone-500">Sign in to continue your journey</p>
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
