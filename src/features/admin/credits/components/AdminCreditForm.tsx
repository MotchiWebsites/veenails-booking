"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { issueAdminCreditAction, type AdminCreditState } from "@/features/admin/credits/actions/admin-credits";

const initial: AdminCreditState = { error: "", success: "", messageId: "" };

export default function AdminCreditForm({ userId, bookingId }: { userId: string; bookingId?: string }) {
    const { error, success } = useToast();
    const [state, action, pending] = useActionState(issueAdminCreditAction, initial);
    useEffect(() => { if (!state.messageId) return; if (state.error) error(state.error, "Credit not issued"); if (state.success) success(state.success, "Credit issued"); }, [error, state.error, state.messageId, state.success, success]);

    return <form action={action} className="space-y-4">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="bookingId" value={bookingId ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2"><span className="label-text">Credit amount</span><input name="amount" type="number" min="0.01" step="0.01" required className="input-field" placeholder="25.00" /></label>
            <label className="space-y-2"><span className="label-text">Expiry date (optional)</span><input name="expiresAt" type="date" className="input-field" /></label>
        </div>
        <label className="block space-y-2"><span className="label-text">Reason</span><textarea name="reason" required minLength={4} className="input-field min-h-24 resize-y leading-relaxed" placeholder="Why is this credit being issued?" /></label>
        <button type="submit" className="btn-secondary w-full sm:w-auto" disabled={pending}>{pending ? "Issuing…" : "Issue credit"}</button>
    </form>;
}
