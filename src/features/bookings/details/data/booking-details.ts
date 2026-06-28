import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/features/auth/guards/get-user";
import type {
    BookingSummary,
    CancellationRequestStatus,
    DepositStatus,
} from "@/features/bookings/types/bookings";
import type { DesignTier } from "@/features/bookings/new-booking/types";
import { canShowClientArrivalInfo } from "@/features/bookings/utils/booking-status";
import type { Database, Enums } from "@/types/supabase";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";

type BookingDetailsBaseRow = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    | "id"
    | "booking_reference"
    | "status"
    | "deposit_status"
    | "estimated_total"
    | "final_total"
    | "subtotal_amount"
    | "booking_fee_amount"
    | "booking_fee_mode"
    | "booking_fee_rate"
    | "deposit_amount"
    | "amount_paid"
    | "amount_due"
    | "created_at"
    | "client_notes"
>;

type BookingSlotRelation =
    | Pick<
          Database["public"]["Tables"]["availability_slots"]["Row"],
          "starts_at" | "ends_at"
      >
    | Array<
          Pick<
              Database["public"]["Tables"]["availability_slots"]["Row"],
              "starts_at" | "ends_at"
          >
      >
    | null;

type BookingDetailsRow = BookingDetailsBaseRow & {
    availability_slots?: BookingSlotRelation;
    booking_line_items?: Array<
        Pick<
            Database["public"]["Tables"]["booking_line_items"]["Row"],
            | "id"
            | "item_type"
            | "label_snapshot"
            | "description_snapshot"
            | "quantity"
            | "unit_price"
            | "line_total"
            | "source_id"
            | "source_table"
            | "active"
            | "removed_at"
            | "created_at"
        >
    > | null;
    booking_payments?: Array<
        Pick<
            Database["public"]["Tables"]["booking_payments"]["Row"],
            | "id"
            | "payment_type"
            | "method"
            | "amount"
            | "status"
            | "paid_at"
            | "created_at"
        >
    > | null;
    booking_policy_acceptances?: Array<
        Pick<
            Database["public"]["Tables"]["booking_policy_acceptances"]["Row"],
            "id" | "title_snapshot" | "description_snapshot" | "accepted_at"
        >
    > | null;
    cancellation_requests?: Array<
        Pick<
            Database["public"]["Tables"]["cancellation_requests"]["Row"],
            | "id"
            | "status"
            | "reason"
            | "requested_refund_method"
            | "created_at"
            | "reviewed_at"
        >
    > | null;
    booking_inspo_prompts?: Array<
        Pick<
            Database["public"]["Tables"]["booking_inspo_prompts"]["Row"],
            | "id"
            | "status"
            | "inspo_sent_at"
            | "reviewed_at"
            | "created_at"
        >
    > | null;
};

export type BookingDetailsPayment = {
    id: string;
    type: Enums<"payment_type">;
    method: Enums<"payment_method">;
    amount: number;
    status: Enums<"payment_status">;
    paidAt: string | null;
    createdAt: string;
};

export type BookingDetailsPolicy = {
    id: string;
    title: string;
    description: string;
    acceptedAt: string;
};

export type BookingDetailsCancellationRequest = {
    id: string;
    status: CancellationRequestStatus;
    reason: string;
    requestedRefundMethod: Enums<"refund_method">;
    createdAt: string;
    reviewedAt: string | null;
};

export type BookingDetailsInspoPrompt = {
    id: string;
    status: Enums<"booking_inspo_status">;
    inspoSentAt: string | null;
    reviewedAt: string | null;
    createdAt: string;
};

export type BookingDetailsData = {
    summary: BookingSummary;
    clientNotes: string | null;
    rejectionReason: string | null;
    cancellationReason: string | null;
    subtotalAmount: number;
    bookingFeeAmount: number;
    bookingFeeMode: Enums<"fee_mode">;
    bookingFeeRate: number;
    depositAmount: number;
    amountPaid: number;
    amountDue: number;
    arrivalInfo: {
        address: string | null;
        buzzerCode: string | null;
    } | null;
    depositStatus: DepositStatus;
    payments: BookingDetailsPayment[];
    policies: BookingDetailsPolicy[];
    cancellationRequest: BookingDetailsCancellationRequest | null;
    inspoPrompt: BookingDetailsInspoPrompt | null;
};

export type EditBookingSlot = {
    id: string;
    startsAt: string;
    endsAt: string | null;
};

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price" | "display_order"
>;

const detailsSelect = `
    id,
    booking_reference,
    status,
    deposit_status,
    estimated_total,
    final_total,
    subtotal_amount,
    booking_fee_amount,
    booking_fee_mode,
    booking_fee_rate,
    deposit_amount,
    amount_paid,
    amount_due,
    created_at,
    client_notes,
    availability_slots:slot_id (
        starts_at,
        ends_at
    ),
    booking_line_items (
        id,
        item_type,
        label_snapshot,
        description_snapshot,
        quantity,
        unit_price,
        line_total,
        source_id,
        source_table,
        active,
        removed_at,
        created_at
    ),
    booking_payments (
        id,
        payment_type,
        method,
        amount,
        status,
        paid_at,
        created_at
    ),
    booking_policy_acceptances (
        id,
        title_snapshot,
        description_snapshot,
        accepted_at
    ),
    cancellation_requests (
        id,
        status,
        reason,
        requested_refund_method,
        created_at,
        reviewed_at
    ),
    booking_inspo_prompts (
        id,
        status,
        inspo_sent_at,
        reviewed_at,
        created_at
    )
`;

function sortByCreatedAt<T extends { created_at: string }>(rows: T[]) {
    return rows
        .slice()
        .sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
        );
}

function sortPolicies(
    rows: NonNullable<BookingDetailsRow["booking_policy_acceptances"]>,
) {
    return rows
        .slice()
        .sort(
            (a, b) =>
                new Date(a.accepted_at).getTime() -
                new Date(b.accepted_at).getTime(),
        );
}

function mapLineItems(row: BookingDetailsRow): BookingSummary["lineItems"] {
    return sortByCreatedAt(row.booking_line_items ?? [])
        .filter((item) => item.active && !item.removed_at)
        .map((item) => ({
            id: item.id,
            itemType: item.item_type,
            label: item.label_snapshot,
            description: item.description_snapshot,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unit_price || 0),
            lineTotal:
                Number(item.line_total) ||
                Number(item.unit_price || 0) * Number(item.quantity || 0),
            sourceId: item.source_id,
            sourceTable: item.source_table,
        }));
}

function getLatestCancellationRequest(row: BookingDetailsRow) {
    return (
        row.cancellation_requests
            ?.slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )[0] ?? null
    );
}

function getLatestInspoPrompt(row: BookingDetailsRow) {
    return (
        row.booking_inspo_prompts
            ?.slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )[0] ?? null
    );
}

function getSlotRelation(row: BookingDetailsRow) {
    const slot = row.availability_slots;

    return Array.isArray(slot) ? (slot[0] ?? null) : (slot ?? null);
}

function mapDetails(row: BookingDetailsRow): BookingDetailsData {
    const lineItems = mapLineItems(row);
    const latestCancellationRequest = getLatestCancellationRequest(row);
    const latestInspoPrompt = getLatestInspoPrompt(row);
    const slot = getSlotRelation(row);
    const estimatedTotal = Number(row.estimated_total || 0);
    const finalTotal = Number(row.final_total || 0);
    const payments = sortByCreatedAt(row.booking_payments ?? []).map(
        (payment) => ({
            id: payment.id,
            type: payment.payment_type,
            method: payment.method,
            amount: Number(payment.amount || 0),
            status: payment.status,
            paidAt: payment.paid_at,
            createdAt: payment.created_at,
        }),
    );
    const ledger = calculateBookingLedger({
        appointmentTotal: finalTotal > 0 ? finalTotal : estimatedTotal,
        payments,
    });

    const summary: BookingSummary = {
        id: row.id,
        bookingReference: row.booking_reference,
        status: row.status,
        depositStatus: row.deposit_status,
        startsAt: slot?.starts_at ?? null,
        endsAt: slot?.ends_at ?? null,
        estimatedTotal,
        finalTotal,
        subtotalAmount: Number(row.subtotal_amount || 0),
        bookingFeeAmount: Number(row.booking_fee_amount || 0),
        amountPaid: ledger.totalApplied,
        amountDue: ledger.amountDue,
        createdAt: row.created_at,
        lineItems,
        cancellationRequest: latestCancellationRequest
            ? {
                  id: latestCancellationRequest.id,
                  status: latestCancellationRequest.status,
                  reason: latestCancellationRequest.reason,
                  createdAt: latestCancellationRequest.created_at,
              }
            : null,
    };

    return {
        summary,
        clientNotes: row.client_notes,
        rejectionReason: null,
        cancellationReason: null,
        subtotalAmount: Number(row.subtotal_amount || 0),
        bookingFeeAmount: Number(row.booking_fee_amount || 0),
        bookingFeeMode: row.booking_fee_mode,
        bookingFeeRate: Number(row.booking_fee_rate || 0),
        depositAmount: Number(row.deposit_amount || 0),
        amountPaid: ledger.totalApplied,
        amountDue: ledger.amountDue,
        arrivalInfo: null,
        depositStatus: row.deposit_status,
        payments,
        policies: sortPolicies(row.booking_policy_acceptances ?? []).map(
            (policy) => ({
                id: policy.id,
                title: policy.title_snapshot,
                description: policy.description_snapshot,
                acceptedAt: policy.accepted_at,
            }),
        ),
        cancellationRequest: latestCancellationRequest
            ? {
                  id: latestCancellationRequest.id,
                  status: latestCancellationRequest.status,
                  reason: latestCancellationRequest.reason,
                  requestedRefundMethod:
                      latestCancellationRequest.requested_refund_method,
                  createdAt: latestCancellationRequest.created_at,
                  reviewedAt: latestCancellationRequest.reviewed_at,
              }
            : null,
        inspoPrompt: latestInspoPrompt
            ? {
                  id: latestInspoPrompt.id,
                  status: latestInspoPrompt.status,
                  inspoSentAt: latestInspoPrompt.inspo_sent_at,
                  reviewedAt: latestInspoPrompt.reviewed_at,
                  createdAt: latestInspoPrompt.created_at,
              }
            : null,
    };
}

export async function getBookingDetailsData({
    bookingId,
    bookingReference,
    userId,
}: {
    bookingId?: string;
    bookingReference?: string;
    userId: string;
}): Promise<BookingDetailsData | null> {
    const supabase = await createClient();

    let query = supabase
        .from("bookings")
        .select(detailsSelect)
        .eq("user_id", userId);

    if (bookingReference) {
        query = query.eq("booking_reference", bookingReference);
    } else if (bookingId) {
        query = query.eq("id", bookingId);
    } else {
        return null;
    }

    const { data, error } = await query
        .maybeSingle()
        .overrideTypes<BookingDetailsRow | null>();

    if (error) {
        console.error("[bookings:getBookingDetailsData]", error);
        throw new Error("We couldn't load this booking right now.");
    }

    if (!data) return null;

    const details = mapDetails(data);
    const admin = createAdminClient();
    if (details.summary.status === "cancelled") {
        const { data: cancellationEvent, error: cancellationError } =
            await admin
                .from("booking_events")
                .select("metadata")
                .eq("booking_id", details.summary.id)
                .eq("event_type", "admin_booking_cancelled")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
                .overrideTypes<{
                    metadata: Database["public"]["Tables"]["booking_events"]["Row"]["metadata"];
                } | null>();

        if (cancellationError) {
            console.error(
                "[bookings:getCancellationReason]",
                cancellationError,
            );
        }

        const reason =
            cancellationEvent?.metadata &&
            typeof cancellationEvent.metadata === "object" &&
            !Array.isArray(cancellationEvent.metadata) &&
            typeof cancellationEvent.metadata.reason === "string"
                ? cancellationEvent.metadata.reason.trim()
                : "";

        return {
            ...details,
            cancellationReason: reason || null,
        };
    }

    if (details.summary.status === "rejected") {
        const { data: rejectionEvent, error: rejectionError } = await admin
            .from("booking_events")
            .select("metadata")
            .eq("booking_id", details.summary.id)
            .in("event_type", [
                "admin_booking_rejected",
                "admin_booking_rejected_deposit_credited",
                "admin_booking_rejected_deposit_not_received",
            ])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .overrideTypes<{ metadata: Database["public"]["Tables"]["booking_events"]["Row"]["metadata"] } | null>();

        if (rejectionError) {
            console.error("[bookings:getRejectionReason]", rejectionError);
        }

        const reason =
            rejectionEvent?.metadata &&
            typeof rejectionEvent.metadata === "object" &&
            !Array.isArray(rejectionEvent.metadata) &&
            typeof rejectionEvent.metadata.reason === "string"
                ? rejectionEvent.metadata.reason.trim()
                : "";

        return {
            ...details,
            rejectionReason: reason || null,
        };
    }

    if (!canShowClientArrivalInfo(details.summary.status)) {
        return details;
    }

    const { data: settings, error: settingsError } = await admin
        .from("booking_settings")
        .select("studio_address, studio_buzzer_code")
        .eq("active", true)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle()
        .overrideTypes<{
            studio_address: string | null;
            studio_buzzer_code: string | null;
        } | null>();

    if (settingsError) {
        console.error("[bookings:getArrivalInfo]", settingsError);
        return details;
    }

    return {
        ...details,
        arrivalInfo: {
            address: settings?.studio_address ?? null,
            buzzerCode: settings?.studio_buzzer_code ?? null,
        },
    };
}

export async function getAvailableEditBookingSlots(): Promise<
    EditBookingSlot[]
> {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const user = await getUser();
    const { data: profile } = user
        ? await supabase
              .from("profiles")
              .select("is_regular")
              .eq("id", user.id)
              .maybeSingle()
              .overrideTypes<{ is_regular: boolean } | null>()
        : { data: null };

    let query = supabase
        .from("availability_slots")
        .select("id, starts_at, ends_at, regulars_first, public_access_at")
        .eq("active", true)
        .eq("status", "available")
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(12);

    if (!profile?.is_regular) {
        query = query.or(`regulars_first.eq.false,public_access_at.lte.${now}`);
    }

    const { data, error } = await query.overrideTypes<
        (Pick<
            Database["public"]["Tables"]["availability_slots"]["Row"],
            "id" | "starts_at" | "ends_at"
        > & { regulars_first: boolean; public_access_at: string })[]
    >();

    if (error) {
        console.error("[bookings:getAvailableEditBookingSlots]", error);
        throw new Error("We couldn't load appointment openings right now.");
    }

    return (data ?? [])
        .filter(
            (slot) =>
                profile?.is_regular ||
                !slot.regulars_first ||
                new Date(slot.public_access_at).getTime() <=
                    new Date(now).getTime(),
        )
        .map((slot) => ({
        id: slot.id,
        startsAt: slot.starts_at,
        endsAt: slot.ends_at,
        availability: "available",
    }));
}

export async function getEditBookingDesignTiers(): Promise<DesignTier[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("design_tiers")
        .select("id, name, description, price, display_order")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .overrideTypes<DesignTierRow[]>();

    if (error) {
        console.error("[bookings:getEditBookingDesignTiers]", error);
        throw new Error("We couldn't load design tiers right now.");
    }

    return (data ?? []).map((tier) => ({
        id: tier.id,
        label: tier.name,
        description: tier.description ?? undefined,
        price: Number(tier.price ?? 0),
        imageSrc: null,
        imageAlt: `${tier.name} design tier preview`,
    }));
}
