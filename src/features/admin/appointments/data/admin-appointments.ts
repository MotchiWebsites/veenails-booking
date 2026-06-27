import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums, Json } from "@/types/supabase";

type BookingStatus = Enums<"booking_status">;
type DepositStatus = Enums<"deposit_status">;
type PaymentStatus = Enums<"payment_status">;
type CancellationStatus = Enums<"cancellation_request_status">;
type InspoStatus = Enums<"booking_inspo_status">;
type PreferredContactMethod = Enums<"preferred_contact_method">;

export type AdminProfileSummary = {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    instagramHandle: string | null;
    preferredContactMethod: PreferredContactMethod;
};

export type AdminAppointmentListItem = {
    id: string;
    bookingReference: string;
    status: BookingStatus;
    depositStatus: DepositStatus;
    startsAt: string | null;
    endsAt: string | null;
    estimatedTotal: number;
    finalTotal: number;
    createdAt: string;
    profile: AdminProfileSummary | null;
    externalClient: {
        displayName: string | null;
        email: string | null;
        instagramHandle: string | null;
        preferredContactMethod: PreferredContactMethod | null;
    };
    latestCancellationStatus: CancellationStatus | null;
    inspoStatus: InspoStatus | null;
    serviceSummary: string;
};

export type AdminLineItem = {
    id: string;
    itemType: string;
    label: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    sourceId: string | null;
    sourceTable: string | null;
};

export type AdminPayment = {
    id: string;
    amount: number;
    status: PaymentStatus;
    paymentType: string;
    method: string;
    paidAt: string | null;
    notes: string | null;
};

export type AdminCancellationRequest = {
    id: string;
    status: CancellationStatus;
    reason: string;
    requestedRefundMethod: string;
    adminReason: string | null;
    adminDecision: string | null;
    createdAt: string;
};

export type AdminInspoPrompt = {
    id: string;
    status: InspoStatus;
    messageText: string;
    instagramUrl: string | null;
    copiedAt: string | null;
    openedAt: string | null;
    inspoSentAt: string | null;
    reviewedAt: string | null;
};

export type AdminBookingEvent = {
    id: string;
    actorType: string;
    eventType: string;
    message: string | null;
    metadata: Json;
    createdAt: string;
};

export type AdminAppointmentDetails = AdminAppointmentListItem & {
    adminNotes: string | null;
    amountDue: number;
    amountPaid: number;
    subtotalAmount: number;
    bookingFeeAmount: number;
    bookingFeeMode: Enums<"fee_mode">;
    bookingFeeRate: number;
    depositAmount: number;
    slotId: string | null;
    lineItems: AdminLineItem[];
    payments: AdminPayment[];
    cancellationRequest: AdminCancellationRequest | null;
    inspoPrompt: AdminInspoPrompt | null;
    events: AdminBookingEvent[];
    editorSlots: Array<{ id: string; startsAt: string; endsAt: string | null }>;
    designTiers: Array<{ id: string; name: string; price: number }>;
    operationalNow: string;
    linkedCredits: Array<{ id: string; amount: number; reason: string | null; active: boolean; createdAt: string }>;
};

type AdminAppointmentRow = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    | "id"
    | "booking_reference"
    | "status"
    | "deposit_status"
    | "estimated_total"
    | "final_total"
    | "created_at"
    | "user_id"
    | "client_display_name"
    | "client_email"
    | "client_instagram_handle"
    | "client_preferred_contact_method"
> & {
    availability_slots:
        | Pick<
              Database["public"]["Tables"]["availability_slots"]["Row"],
              "starts_at" | "ends_at"
          >
        | null;
    profiles: Pick<
        Database["public"]["Tables"]["profiles"]["Row"],
        | "id"
        | "display_name"
        | "email"
        | "phone"
        | "instagram_handle"
        | "preferred_contact_method"
    > | null;
    cancellation_requests:
        | Array<
              Pick<
                  Database["public"]["Tables"]["cancellation_requests"]["Row"],
                  "id" | "status" | "created_at"
              >
          >
        | null;
    booking_inspo_prompts:
        | Array<
              Pick<
                  Database["public"]["Tables"]["booking_inspo_prompts"]["Row"],
                  "id" | "status" | "created_at"
              >
          >
        | null;
    booking_line_items:
        | Array<Pick<Database["public"]["Tables"]["booking_line_items"]["Row"], "id" | "item_type" | "label_snapshot" | "description_snapshot" | "quantity" | "unit_price" | "line_total" | "source_id" | "source_table" | "active" | "removed_at" | "created_at">>
        | null;
};

type AdminAppointmentDetailsRow = AdminAppointmentRow &
    Pick<
        Database["public"]["Tables"]["bookings"]["Row"],
        | "admin_notes"
        | "amount_due"
        | "amount_paid"
        | "subtotal_amount"
        | "booking_fee_amount"
        | "booking_fee_mode"
        | "booking_fee_rate"
        | "deposit_amount"
        | "slot_id"
    > & {
        booking_line_items:
            | Array<
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
              >
            | null;
        booking_payments:
            | Array<
                  Pick<
                      Database["public"]["Tables"]["booking_payments"]["Row"],
                      | "id"
                      | "amount"
                      | "status"
                      | "payment_type"
                      | "method"
                      | "paid_at"
                      | "notes"
                      | "created_at"
                  >
              >
            | null;
        cancellation_requests:
            | Array<
                  Pick<
                      Database["public"]["Tables"]["cancellation_requests"]["Row"],
                      | "id"
                      | "status"
                      | "reason"
                      | "requested_refund_method"
                      | "admin_reason"
                      | "admin_decision"
                      | "created_at"
                  >
              >
            | null;
        booking_inspo_prompts:
            | Array<
                  Pick<
                      Database["public"]["Tables"]["booking_inspo_prompts"]["Row"],
                      | "id"
                      | "status"
                      | "message_text"
                      | "instagram_url"
                      | "copied_at"
                      | "opened_at"
                      | "inspo_sent_at"
                      | "reviewed_at"
                      | "created_at"
                  >
              >
            | null;
        booking_events:
            | Array<
                  Pick<
                      Database["public"]["Tables"]["booking_events"]["Row"],
                      | "id"
                      | "actor_type"
                      | "event_type"
                      | "message"
                      | "metadata"
                      | "created_at"
                  >
              >
            | null;
    };

const listSelect = `
    id,
    booking_reference,
    status,
    deposit_status,
    estimated_total,
    final_total,
    created_at,
    user_id,
    client_display_name,
    client_email,
    client_instagram_handle,
    client_preferred_contact_method,
    availability_slots:slot_id ( starts_at, ends_at ),
    profiles:user_id (
        id,
        display_name,
        email,
        phone,
        instagram_handle,
        preferred_contact_method
    ),
    cancellation_requests ( id, status, created_at ),
    booking_inspo_prompts ( id, status, created_at )
    ,booking_line_items ( label_snapshot, item_type, active, removed_at )
`;

const detailsSelect = `
    id,
    booking_reference,
    status,
    deposit_status,
    estimated_total,
    final_total,
    created_at,
    user_id,
    client_display_name,
    client_email,
    client_instagram_handle,
    client_preferred_contact_method,
    availability_slots:slot_id ( starts_at, ends_at ),
    profiles:user_id (
        id,
        display_name,
        email,
        phone,
        instagram_handle,
        preferred_contact_method
    ),
    admin_notes,
    amount_due,
    amount_paid,
    subtotal_amount,
    booking_fee_amount,
    booking_fee_mode,
    booking_fee_rate,
    deposit_amount,
    slot_id,
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
        amount,
        status,
        payment_type,
        method,
        paid_at,
        notes,
        created_at
    ),
    cancellation_requests (
        id,
        status,
        reason,
        requested_refund_method,
        admin_reason,
        admin_decision,
        created_at
    ),
    booking_inspo_prompts (
        id,
        status,
        message_text,
        instagram_url,
        copied_at,
        opened_at,
        inspo_sent_at,
        reviewed_at,
        created_at
    ),
    booking_events (
        id,
        actor_type,
        event_type,
        message,
        metadata,
        created_at
    )
`;

function mapProfile(row: AdminAppointmentRow["profiles"]) {
    if (!row) return null;

    return {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        phone: row.phone,
        instagramHandle: row.instagram_handle,
        preferredContactMethod: row.preferred_contact_method,
    };
}

function mapPreferredContactMethod(
    value: string | null,
): PreferredContactMethod | null {
    return value === "email" || value === "phone" || value === "instagram"
        ? value
        : null;
}

function latestByCreatedAt<T extends { created_at: string }>(rows: T[] | null | undefined) {
    return (
        rows
            ?.slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )[0] ?? null
    );
}

function mapListItem(row: AdminAppointmentRow): AdminAppointmentListItem {
    return {
        id: row.id,
        bookingReference: row.booking_reference,
        status: row.status,
        depositStatus: row.deposit_status,
        startsAt: row.availability_slots?.starts_at ?? null,
        endsAt: row.availability_slots?.ends_at ?? null,
        estimatedTotal: Number(row.estimated_total ?? 0),
        finalTotal: Number(row.final_total ?? 0),
        createdAt: row.created_at,
        profile: mapProfile(row.profiles),
        externalClient: {
            displayName: row.client_display_name,
            email: row.client_email,
            instagramHandle: row.client_instagram_handle,
            preferredContactMethod: mapPreferredContactMethod(
                row.client_preferred_contact_method,
            ),
        },
        latestCancellationStatus: latestByCreatedAt(row.cancellation_requests)?.status ?? null,
        inspoStatus: latestByCreatedAt(row.booking_inspo_prompts)?.status ?? null,
        serviceSummary: (row.booking_line_items ?? [])
            .filter((item) => item.active && !item.removed_at && item.item_type !== "discount")
            .map((item) => item.label_snapshot)
            .join(" · ") || "No services listed",
    };
}

function mapDetails(row: AdminAppointmentDetailsRow): Omit<AdminAppointmentDetails, "editorSlots" | "designTiers" | "operationalNow" | "linkedCredits"> {
    const listItem = mapListItem(row);
    const cancellation = latestByCreatedAt(row.cancellation_requests);
    const inspo = latestByCreatedAt(row.booking_inspo_prompts);

    return {
        ...listItem,
        adminNotes: row.admin_notes,
        amountDue: Number(row.amount_due ?? 0),
        amountPaid: Number(row.amount_paid ?? 0),
        subtotalAmount: Number(row.subtotal_amount ?? 0),
        bookingFeeAmount: Number(row.booking_fee_amount ?? 0),
        bookingFeeMode: row.booking_fee_mode,
        bookingFeeRate: Number(row.booking_fee_rate ?? 0),
        depositAmount: Number(row.deposit_amount ?? 0),
        slotId: row.slot_id,
        lineItems: (row.booking_line_items ?? [])
            .filter((item) => item.active && !item.removed_at)
            .sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
            )
            .map((item) => ({
                id: item.id,
                itemType: item.item_type,
                label: item.label_snapshot,
                description: item.description_snapshot,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unit_price ?? 0),
                lineTotal: Number(item.line_total ?? 0),
                sourceId: item.source_id,
                sourceTable: item.source_table,
            })),
        payments: (row.booking_payments ?? [])
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )
            .map((payment) => ({
                id: payment.id,
                amount: Number(payment.amount ?? 0),
                status: payment.status,
                paymentType: payment.payment_type,
                method: payment.method,
                paidAt: payment.paid_at,
                notes: payment.notes,
            })),
        cancellationRequest: cancellation
            ? {
                  id: cancellation.id,
                  status: cancellation.status,
                  reason: cancellation.reason,
                  requestedRefundMethod: cancellation.requested_refund_method,
                  adminReason: cancellation.admin_reason,
                  adminDecision: cancellation.admin_decision,
                  createdAt: cancellation.created_at,
              }
            : null,
        inspoPrompt: inspo
            ? {
                  id: inspo.id,
                  status: inspo.status,
                  messageText: inspo.message_text,
                  instagramUrl: inspo.instagram_url,
                  copiedAt: inspo.copied_at,
                  openedAt: inspo.opened_at,
                  inspoSentAt: inspo.inspo_sent_at,
                  reviewedAt: inspo.reviewed_at,
              }
            : null,
        events: (row.booking_events ?? [])
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )
            .map((event) => ({
                id: event.id,
                actorType: event.actor_type,
                eventType: event.event_type,
                message: event.message,
                metadata: event.metadata,
                createdAt: event.created_at,
            })),
    };
}

export async function getAdminAppointments({
    search = "",
    status = "active",
}: {
    search?: string;
    status?: string;
}) {
    await requireAdmin();
    const admin = createAdminClient();

    let query = admin.from("bookings").select(listSelect);

    if (status === "active") {
        query = query.in("status", [
            "held",
            "requested",
            "confirmed",
            "cancellation_requested",
        ]);
    } else if (status && status !== "all") {
        query = query.eq("status", status as BookingStatus);
    }

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(100)
        .overrideTypes<AdminAppointmentRow[]>();

    if (error) {
        console.error("[admin:appointments:list]", error);
        throw new Error("We couldn't load appointments.");
    }

    const normalizedSearch = search.trim().toLowerCase();
    const rows = (data ?? []).map(mapListItem);

    if (!normalizedSearch) {
        return rows;
    }

    return rows.filter((booking) =>
        [
            booking.bookingReference,
            booking.profile?.displayName,
            booking.profile?.email,
            booking.profile?.phone,
            booking.profile?.instagramHandle,
            booking.externalClient.displayName,
            booking.externalClient.email,
            booking.externalClient.instagramHandle,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
    );
}

export async function getAdminAppointmentDetails(bookingId: string) {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("bookings")
        .select(detailsSelect)
        .eq("id", bookingId)
        .maybeSingle()
        .overrideTypes<AdminAppointmentDetailsRow | null>();

    if (error) {
        console.error("[admin:appointments:details]", error);
        throw new Error("We couldn't load this appointment.");
    }

    if (!data) {
        notFound();
    }

    const now = new Date().toISOString();
    const [slotsResult, tiersResult, creditsResult] = await Promise.all([
        admin.from("availability_slots").select("id, starts_at, ends_at").eq("active", true).eq("status", "available").gte("starts_at", now).order("starts_at").limit(120).overrideTypes<Array<{ id: string; starts_at: string; ends_at: string | null }>>(),
        admin.from("design_tiers").select("id, name, price").eq("active", true).order("display_order").overrideTypes<Array<{ id: string; name: string; price: number }>>(),
        admin.from("user_credits").select("id, amount, reason, active, created_at").eq("source_booking_id", bookingId).order("created_at", { ascending: false }).overrideTypes<Array<{ id: string; amount: number; reason: string | null; active: boolean; created_at: string }>>(),
    ]);
    if (slotsResult.error || tiersResult.error || creditsResult.error) {
        console.error("[admin:appointments:editor-data]", slotsResult.error ?? tiersResult.error ?? creditsResult.error);
        throw new Error("We couldn't load appointment editing options.");
    }

    return {
        ...mapDetails(data),
        editorSlots: (slotsResult.data ?? []).map((slot) => ({ id: slot.id, startsAt: slot.starts_at, endsAt: slot.ends_at })),
        designTiers: (tiersResult.data ?? []).map((tier) => ({ id: tier.id, name: tier.name, price: Number(tier.price) })),
        operationalNow: new Date().toISOString(),
        linkedCredits: (creditsResult.data ?? []).map((credit) => ({ id: credit.id, amount: Number(credit.amount), reason: credit.reason, active: credit.active, createdAt: credit.created_at })),
    };
}
