import Link from "next/link";
import { FiClock } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import type { EditBookingSlot } from "@/features/bookings/details/data/booking-details";
import { formatBookingDateTime } from "@/features/bookings/utils/booking-formatters";

export default function EditBookingSlotPicker({
    slots,
}: {
    slots: EditBookingSlot[];
}) {
    return (
        <StepSectionCard
            icon={<FiClock className="h-5 w-5" aria-hidden="true" />}
            title="Available time choices"
            description="Changing an existing appointment needs studio review. To choose a different time, start a new request and cancel this one if needed."
        >
            {slots.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {slots.map((slot) => (
                        <Link
                            key={slot.id}
                            href={`/book?slotId=${encodeURIComponent(slot.id)}`}
                            className="rounded-3xl border border-border/60 bg-background p-4 transition hover:border-pink-main/40 hover:bg-pink-main/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <p className="text-sm font-semibold text-foreground">
                                {formatBookingDateTime(
                                    slot.startsAt,
                                    slot.endsAt,
                                )}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-dark-green">
                                Start new request
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="rounded-3xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted">
                    No appointment openings are listed right now.
                </p>
            )}
        </StepSectionCard>
    );
}
