import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@shared/schemas";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "@/components/forms/FormField";
import { ErrorSummary } from "@/components/forms/ErrorSummary";
import { ApiError } from "@/types/api";
import { defaultPathForRole } from "@/routes/defaultPath";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [topError, setTopError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setTopError(null);
    try {
      const user = await login(values);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? defaultPathForRole(user.role), { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fieldErrors) {
          for (const [field, msg] of Object.entries(e.fieldErrors)) {
            setError(field as keyof LoginInput, { message: msg });
          }
        }
        setTopError(e.message);
      }
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, padding: "3rem 1rem" }}>
      <div className="card">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Sign in to access your WSU bookings.</p>
        <ErrorSummary message={topError} />
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ marginTop: "0.5rem" }}
          >
            {isSubmitting ? <span className="spinner-inline" /> : "Sign in"}
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
          Demo accounts (password: <code>password123</code>): alex@wsu.edu,
          advisor@wsu.edu, admin@wsu.edu
        </p>
      </div>
    </div>
  );
}
