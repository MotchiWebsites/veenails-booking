import { FiFileText } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";

export default function BookingPoliciesCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    if (data.policies.length === 0) {
        return null;
    }

    return (
        <StepSectionCard
            icon={<FiFileText className="h-5 w-5" aria-hidden="true" />}
            title="Accepted policies"
            description="Policies accepted when this booking request was submitted."
        >
            <div className="space-y-3">
                {data.policies.map((policy) => (
                    <div
                        key={policy.id}
                        className="rounded-3xl border border-border/60 bg-background p-4"
                    >
                        <p className="text-sm font-semibold text-foreground">
                            {policy.title}
                        </p>
                        {policy.description ? (
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {policy.description}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div>
        </StepSectionCard>
    );
}
