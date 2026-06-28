import "server-only";

import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

type AdminClient = ReturnType<typeof createAdminClient>;

export type CompletedBookingSettlement = {
    appointmentTotal: number;
    totalApplied: number;
    overpaymentCredit: number;
    creditId: string | null;
};

export async function completeBookingWithSettlement({
    admin,
    bookingId,
    userId,
    adminUserId,
}: {
    admin: AdminClient;
    bookingId: string;
    userId: string | null;
    adminUserId: string;
}): Promise<CompletedBookingSettlement> {
    const { data: financials, error: financialsError } = await admin
        .from("bookings")
        .select(
            "estimated_total, final_total, booking_payments(amount, payment_type, status)",
        )
        .eq("id", bookingId)
        .eq("status", "confirmed")
        .maybeSingle()
        .overrideTypes<{
            estimated_total: number;
            final_total: number;
            booking_payments: Array<{
                amount: number;
                payment_type: string;
                status: Enums<"payment_status">;
            }> | null;
        } | null>();

    if (financialsError || !financials) {
        throw financialsError ?? new Error("Booking financials changed.");
    }

    const appointmentTotal = Number(
        financials.final_total > 0
            ? financials.final_total
            : financials.estimated_total,
    );
    const ledger = calculateBookingLedger({
        appointmentTotal,
        payments: (financials.booking_payments ?? []).map((payment) => ({
            type: payment.payment_type,
            status: payment.status,
            amount: Number(payment.amount),
        })),
    });

    if (ledger.overpayment > 0 && !userId) {
        throw new Error(
            "External-client overpayment requires manual resolution.",
        );
    }

    const completedAt = new Date().toISOString();
    const { data: completed, error: completeError } = await admin
        .from("bookings")
        .update({
            status: "completed",
            completed_at: completedAt,
            final_total: ledger.appointmentTotal,
        })
        .eq("id", bookingId)
        .eq("status", "confirmed")
        .select("id")
        .maybeSingle();

    if (completeError || !completed) {
        throw completeError ?? new Error("Booking status changed.");
    }

    let creditId: string | null = null;
    let insertedCredit = false;

    try {
        if (ledger.overpayment > 0 && userId) {
            const { data: existingCredit, error: existingCreditError } =
                await admin
                    .from("user_credits")
                    .select("id, amount")
                    .eq("user_id", userId)
                    .eq("source_booking_id", bookingId)
                    .ilike("reason", "Appointment overpayment credit%")
                    .limit(1)
                    .maybeSingle()
                    .overrideTypes<{ id: string; amount: number } | null>();

            if (existingCreditError) throw existingCreditError;

            if (existingCredit) {
                creditId = existingCredit.id;
            } else {
                const { data: credit, error: creditError } = await admin
                    .from("user_credits")
                    .insert({
                        user_id: userId,
                        amount: ledger.overpayment,
                        reason: "Appointment overpayment credit · automatic settlement",
                        source_booking_id: bookingId,
                    })
                    .select("id")
                    .single();

                if (creditError) throw creditError;
                creditId = credit.id;
                insertedCredit = true;

                const { error: eventError } = await admin
                    .from("booking_events")
                    .insert({
                        booking_id: bookingId,
                        actor_type: "admin",
                        actor_user_id: adminUserId,
                        event_type: "appointment_overpayment_credited",
                        message: `An overpayment of $${ledger.overpayment.toFixed(2)} was returned as studio credit.`,
                        metadata: {
                            creditId,
                            appointmentTotal: ledger.appointmentTotal,
                            totalApplied: ledger.totalApplied,
                            amount: ledger.overpayment,
                        },
                    });

                if (eventError) throw eventError;
            }
        }
    } catch (error) {
        if (insertedCredit && creditId) {
            await admin.from("user_credits").delete().eq("id", creditId);
        }
        await admin
            .from("bookings")
            .update({
                status: "confirmed",
                completed_at: null,
                final_total: financials.final_total,
            })
            .eq("id", bookingId)
            .eq("status", "completed");
        throw error;
    }

    return {
        appointmentTotal: ledger.appointmentTotal,
        totalApplied: ledger.totalApplied,
        overpaymentCredit: ledger.overpayment,
        creditId,
    };
}
