import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints";
import { profileUpdateSchema, type ProfileUpdateInput } from "@shared/schemas";
import { FormField } from "@/components/forms/FormField";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function Profile() {
  const { user } = useAuth();
  const { push: toast } = useToast();
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
        <h1 className="page-title">Profile</h1>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
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
    </div>
  );
}
