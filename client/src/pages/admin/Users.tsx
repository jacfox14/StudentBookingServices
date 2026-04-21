import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "@/api/endpoints";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import type { User } from "@shared/schemas";

export default function AdminUsers() {
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);
  const [filter, setFilter] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.users,
  });

  const updateUser = useMutation({
    mutationFn: (u: User) => adminApi.updateUser(u.id, { isBanned: !u.isBanned }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast("User updated", "success");
      setConfirmTarget(null);
    },
  });

  const shown = (users ?? []).filter((u) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      u.email.toLowerCase().includes(f) ||
      u.firstName.toLowerCase().includes(f) ||
      u.lastName.toLowerCase().includes(f) ||
      u.role.includes(f)
    );
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage accounts and roles</p>
      </div>

      <input
        type="search"
        className="form-control mb-3"
        placeholder="Filter by name, email, or role"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-badge--${u.role === "staff" ? "provider" : u.role}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-badge--${u.isBanned ? "cancelled" : "confirmed"}`}>
                    {u.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-sm ${u.isBanned ? "btn-success" : "btn-danger"}`}
                    onClick={() => setConfirmTarget(u)}
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.isBanned ? "Unban user?" : "Ban user?"}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmTarget(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${confirmTarget?.isBanned ? "btn-success" : "btn-danger"}`}
              disabled={updateUser.isPending}
              onClick={() => confirmTarget && updateUser.mutate(confirmTarget)}
            >
              {updateUser.isPending ? <span className="spinner-inline" /> : "Confirm"}
            </button>
          </>
        }
      >
        {confirmTarget && (
          <p>
            {confirmTarget.isBanned
              ? `Allow ${confirmTarget.email} to sign in again?`
              : `Prevent ${confirmTarget.email} from signing in?`}
          </p>
        )}
      </Modal>
    </div>
  );
}
