import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    setSubmitting(true);

    try {
      const errorMsg = await login(data.email, data.password);
      if (!errorMsg) {
        navigate("/dashboard");
      } else {
        setAuthError(errorMsg);
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-[400px] p-6 bg-white rounded-lg shadow-md"
      >
        <h2 className="text-center text-2xl font-bold mb-2">Helpdesk</h2>
        <p className="text-center text-gray-500 mb-6">Sign in to your account</p>

        {authError && (
          <p className="text-sm text-red-500 mb-4 text-center bg-red-50 p-2 rounded">
            {authError}
          </p>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`w-full border rounded px-3 py-2 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`w-full border rounded px-3 py-2 ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
