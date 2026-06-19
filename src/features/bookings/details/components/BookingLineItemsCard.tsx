import { FiList } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { formatMoney } from "@/features/bookings/utils/booking-formatters";

export default function BookingLineItemsCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    const items = data.summary.lineItems;

    return (
        <StepSectionCard
            icon={<FiList className="h-5 w-5" aria-hidden="true" />}
            title="Services"
            description="The service items currently attached to this booking."
        >
            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-3xl border border-border/60 bg-background p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Qty {item.quantity}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {formatMoney(item.lineTotal)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="rounded-3xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted">
                    Service details are still being finalized.
                </p>
            )}
        </StepSectionCard>
    );
}
