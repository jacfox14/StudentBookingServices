import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isPending: boolean;
}

export function RejectBookingModal({ open, onClose, onSubmit, isPending }: Props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isPending) onClose();
      }}
      title="Reject booking"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!reason.trim() || isPending}
            onClick={() => onSubmit(reason)}
          >
            {isPending ? <span className="spinner-inline" /> : "Reject"}
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
  );
}
