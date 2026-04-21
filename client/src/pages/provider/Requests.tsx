import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { bookingsApi, providerApi } from "@/api/endpoints";
import { fmtDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

export default function ProviderRequests() {
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["provider", "requests"],
    queryFn: providerApi.requests,
  });

  const approve = useMutation({
    mutationFn: (id: number) => bookingsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider", "requests"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast("Booking approved", "success");
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      bookingsApi.reject(id, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider", "requests"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast("Booking rejected", "info");
      setRejectingId(null);
      setReason("");
    },
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Booking requests</h1>
        <p className="page-subtitle">Approve or reject pending bookings.</p>
      </div>

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : !requests?.length ? (
        <div className="card">No pending requests right now.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Service</th><th>When</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td>{r.serviceTitle}</td>
                <td>{fmtDateTime(r.startAt)}</td>
                <td style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>{r.notes ?? "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(r.id)}
                  >
                    Approve
                  </button>{" "}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => setRejectingId(r.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        title="Reject booking"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setRejectingId(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!reason.trim() || reject.isPending}
              onClick={() => rejectingId && reject.mutate({ id: rejectingId, reason })}
            >
              {reject.isPending ? <span className="spinner-inline" /> : "Reject"}
            </button>
          </>
        }
      >
        <p>Tell the student why you're rejecting this booking:</p>
        <textarea
          className="form-control"
          rows={3}
          maxLength={255}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
