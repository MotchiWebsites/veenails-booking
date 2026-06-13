"use client";

import { useActionState, useEffect, useState } from "react";
import { FiSend } from "react-icons/fi";

import AppSelect from "@/components/shared/form/AppSelect";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { requestBookingDateChange } from "@/features/bookings/actions/bookings";
import type {
    BookingDetailsData,
    EditBookingSlot,
} from "@/features/bookings/details/data/booking-details";
import type { BookingEditActionState } from "@/features/bookings/types/bookings";
import { formatBookingDateTime } from "@/features/bookings/utils/booking-formatters";

const initialState: BookingEditActionState = {
    error: "",
    success: "",
    messageId: "",
};

export default function EditDateChangeRequest({
    data,
    slots,
    canEdit,
}: {
    data: BookingDetailsData;
    slots: EditBookingSlot[];
    canEdit: boolean;
}) {
    const { error, success } = useToast();
    const [slotId, setSlotId] = useState("");
    const [state, formAction, pending] = useActionState(
        requestBookingDateChange,
        initialState,
    );

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Date change failed");
            return;
        }

        if (state.success) {
            success(state.success, "Request sent");
        }
    }, [error, state.error, state.messageId, state.success, success]);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="bookingId" value={data.summary.id} />
            <input type="hidden" name="slotId" value={slotId} />

            <AppSelect
                label="Preferred appointment time"
                value={slotId}
                onChange={setSlotId}
                disabled={!canEdit || pending || slots.length === 0}
                placeholder={
                    slots.length > 0
                        ? "Choose a time to request"
                        : "No openings listed"
                }
                helperText="Date changes are sent to the studio for approval."
                options={slots.map((slot) => ({
                    value: slot.id,
                    label: formatBookingDateTime(slot.startsAt, slot.endsAt),
                }))}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="submit"
                    className="btn-secondary"
                    disabled={!canEdit || pending || !slotId}
                >
                    <FiSend className="h-4 w-4" aria-hidden="true" />
                    {pending ? "Sending..." : "Request date change"}
                </button>
            </div>
        </form>
    );
}
