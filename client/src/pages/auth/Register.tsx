import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerSchema, type RegisterInput } from "@shared/schemas";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "@/components/forms/FormField";
import { ErrorSummary } from "@/components/forms/ErrorSummary";
import { ApiError } from "@/types/api";
import { defaultPathForRole } from "@/routes/defaultPath";

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [topError, setTopError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  async function onSubmit(values: RegisterInput) {
    setTopError(null);
    try {
      const user = await registerUser(values);
      navigate(defaultPathForRole(user.role), { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fieldErrors) {
          for (const [field, msg] of Object.entries(e.fieldErrors)) {
            setError(field as keyof RegisterInput, { message: msg });
          }
        }
        setTopError(e.message);
      }
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560, padding: "3rem 1rem" }}>
      <div className="card">
        <h1 className="page-title">Create your account</h1>
        <p className="page-subtitle">Join SBS as a student or campus staff member.</p>
        <ErrorSummary message={topError} />
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-2" style={{ gap: "1rem" }}>
            <FormField label="First name" error={errors.firstName?.message} {...register("firstName")} />
            <FormField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <FormField label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <FormField
            label="Password"
            type="password"
            error={errors.password?.message}
            hint="Minimum 8 characters"
            {...register("password")}
          />
          <FormField
            label="Confirm password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <FormField
            as="select"
            label="Role"
            error={errors.role?.message}
            {...register("role")}
          >
            <option value="student">Student</option>
            <option value="staff">Staff / Faculty (Provider)</option>
          </FormField>
          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner-inline" /> : "Create account"}
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
