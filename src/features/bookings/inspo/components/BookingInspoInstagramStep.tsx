"use client";

import { useEffect, useState, useTransition } from "react";
import { FiSend } from "react-icons/fi";

import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    getOrCreateBookingInspoPrompt,
    markBookingInspoCopied,
    markBookingInspoOpened,
    markBookingInspoSent,
    type BookingInspoPrompt,
} from "@/features/bookings/inspo/actions/booking-inspo";
import InstagramHandoffCard from "@/features/bookings/inspo/components/InstagramHandoffCard";
import InspoMessageCopyCard from "@/features/bookings/inspo/components/InspoMessageCopyCard";
import InspoSentConfirmation from "@/features/bookings/inspo/components/InspoSentConfirmation";

export default function BookingInspoInstagramStep({
    bookingId,
    compact = false,
}: {
    bookingId: string;
    compact?: boolean;
}) {
    const { error, success } = useToast();
    const [prompt, setPrompt] = useState<BookingInspoPrompt | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        let active = true;

        async function loadPrompt() {
            setLoading(true);
            const result = await getOrCreateBookingInspoPrompt(bookingId);

            if (!active) return;

            if (result.error) {
                setLoadError(result.error);
                setLoading(false);
                return;
            }

            setPrompt(result.prompt ?? null);
            setLoadError(null);
            setLoading(false);
        }

        void loadPrompt();

        return () => {
            active = false;
        };
    }, [bookingId]);

    function handleCopy() {
        if (!prompt) return;

        startTransition(async () => {
            const result = await markBookingInspoCopied(prompt.id);

            if (result.prompt) {
                setPrompt(result.prompt);
            }

            if (result.error) {
                error(result.error, "Copy status not saved");
            }
        });
    }

    function handleOpenInstagram() {
        if (!prompt?.instagramUrl) return;

        window.open(prompt.instagramUrl, "_blank", "noopener,noreferrer");

        startTransition(async () => {
            const result = await markBookingInspoOpened(prompt.id);

            if (result.prompt) {
                setPrompt(result.prompt);
            }

            if (result.error) {
                error(result.error, "Instagram status not saved");
            }
        });
    }

    function handleSent() {
        if (!prompt) return;

        startTransition(async () => {
            const result = await markBookingInspoSent(prompt.id);

            if (result.prompt) {
                setPrompt(result.prompt);
            }

            if (result.error) {
                error(result.error, "Inspo status not saved");
                return;
            }

            success(
                result.success ??
                    "Inspo sent. The studio will review it with your booking.",
                "Inspo sent",
            );
        });
    }

    if (loading) {
        return (
            <div className="rounded-3xl border border-border/60 bg-background p-4 text-sm text-muted">
                Preparing your inspo message...
            </div>
        );
    }

    if (loadError || !prompt) {
        return (
            <div className="rounded-3xl border border-border/60 bg-background p-4 text-sm text-muted">
                {loadError ??
                    "Instagram handoff is unavailable right now. Please contact the studio directly."}
            </div>
        );
    }

    const sent = prompt.status === "sent" || prompt.status === "reviewed";

    if (sent) {
        return (
            <div
                className={[
                    "space-y-4 rounded-3xl border border-border/60 bg-background p-4",
                    compact ? "" : "sm:p-5",
                ].join(" ")}
            >
                <InspoSentConfirmation />
                {prompt.instagramUrl ? (
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                Send more inspo?
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted">
                                Open the same Instagram chat or scan the QR code
                                to add more photos to your appointment thread.
                            </p>
                        </div>
                        <InstagramHandoffCard
                            instagramUrl={prompt.instagramUrl}
                            compact
                            disabled={pending}
                            onOpen={handleOpenInstagram}
                        />
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <div
            className={[
                "space-y-4 rounded-3xl border border-border/60 bg-background p-4",
                compact ? "" : "sm:p-5",
            ].join(" ")}
        >
            <div>
                <h3 className="text-lg font-semibold text-foreground">
                    Submit your design inspo on Instagram
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Copy the message below, scan the QR code or click the button
                    to open our Instagram DM, send the copied message, then send
                    your inspo photos in the same chat.
                </p>
            </div>

            <InspoMessageCopyCard
                message={prompt.messageText}
                disabled={pending}
                onCopy={handleCopy}
            />

            {prompt.instagramUrl ? (
                <InstagramHandoffCard
                    instagramUrl={prompt.instagramUrl}
                    disabled={pending}
                    onOpen={handleOpenInstagram}
                />
            ) : (
                <p className="rounded-2xl border border-dashed border-border/60 bg-surface p-4 text-sm text-muted">
                    Instagram handoff is unavailable right now. Please contact
                    the studio directly.
                </p>
            )}

            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={handleSent}
                    disabled={pending}
                    className="btn-secondary w-full sm:w-auto"
                >
                    <FiSend className="h-4 w-4" aria-hidden="true" />
                    {pending ? "Saving..." : "I sent my inspo"}
                </button>
            </div>
        </div>
    );
}
