import {
    formatBookingDate,
    formatBookingTimeRange,
    formatMoney,
    formatShortLineItems,
} from "@/features/bookings/utils/booking-formatters";

import {
    getBookingStatusLabel,
    getDepositStatusLabel,
} from "@/features/bookings/utils/booking-status";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import type { BookingSummary } from "@/features/bookings/types/bookings";

type TotalDisplay = {
    label: string;
    value: string;
};

type SummaryRowsData = Pick<
    BookingDetailsData,
    "depositStatus" | "cancellationRequest"
>;

type SummaryRow = {
    label: string;
    value: string;
};

function formatCancellationStatus(status: string): string {
    return status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export const summaryRows = (
    booking: BookingSummary,
    totalDisplay: TotalDisplay,
    estimatedAmountDue: number,
    creditUsed: number,
    data: SummaryRowsData,
): SummaryRow[] => [
    { label: "Date", value: formatBookingDate(booking.startsAt) },
    {
        label: "Time",
        value: formatBookingTimeRange(booking.startsAt, booking.endsAt),
    },
    { label: "Status", value: getBookingStatusLabel(booking.status) },
    {
        label: "Services",
        value: formatShortLineItems(booking.lineItems),
    },
    {
        label: "Design tier",
        value:
            booking.lineItems.find((item) => item.itemType === "design_tier")
                ?.label ?? "Not selected",
    },
    {
        label: "Removal option",
        value:
            booking.lineItems.find((item) => item.itemType === "removal")
                ?.label ?? "No removal",
    },
    { label: totalDisplay.label, value: totalDisplay.value },
    {
        label: "Estimated amount due",
        value: formatMoney(estimatedAmountDue),
    },
    {
        label: "Deposit/payment status",
        value: getDepositStatusLabel(data.depositStatus),
    },
    ...(creditUsed > 0
        ? [{ label: "Credit used", value: formatMoney(creditUsed) }]
        : []),
    ...(data.cancellationRequest
        ? [
              {
                  label: "Cancellation request",
                  value: formatCancellationStatus(
                      data.cancellationRequest.status,
                  ),
              },
          ]
        : []),
];
