import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi, providerApi } from "@/api/endpoints";
import { profileUpdateSchema, type ProfileUpdateInput } from "@shared/schemas";
import { FormField } from "@/components/forms/FormField";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function ProviderProfile() {
  const { user } = useAuth();
  const { push: toast } = useToast();
  const { data: services } = useQuery({
    queryKey: ["provider", "services"],
    queryFn: providerApi.myServices,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
    },
  });

  const update = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: () => toast("Profile updated", "success"),
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Your profile</h1>
      </div>

      <div className="card" style={{ maxWidth: 560, marginBottom: "1.5rem" }}>
        <form
          onSubmit={handleSubmit((v) => update.mutate(v))}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField label="First name" type="text" error={errors.firstName?.message} {...register("firstName")} />
            <FormField label="Last name" type="text" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <FormField label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting || update.isPending} style={{ marginTop: "0.5rem" }}>
            {update.isPending ? <span className="spinner-inline" /> : "Save changes"}
          </button>
        </form>
      </div>

      <section className="card" style={{ maxWidth: 560 }}>
        <h2>Services you provide</h2>
        {!services?.length ? (
          <p>You have no services yet. Contact an admin to add one.</p>
        ) : (
          <ul>
            {services.map((s) => (
              <li key={s.id}>
                <strong>{s.title}</strong> — {s.location} · {s.durationMinutes} min
                {!s.isActive && <em> (inactive)</em>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
