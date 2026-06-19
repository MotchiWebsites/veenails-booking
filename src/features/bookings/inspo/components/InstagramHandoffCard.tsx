"use client";

import { QRCodeSVG } from "qrcode.react";
import { FiExternalLink } from "react-icons/fi";

export default function InstagramHandoffCard({
    instagramUrl,
    disabled,
    compact = false,
    onOpen,
}: {
    instagramUrl: string;
    disabled?: boolean;
    compact?: boolean;
    onOpen: () => void;
}) {
    return (
        <div
            className={[
                "rounded-2xl border border-border/60 bg-surface",
                compact ? "p-3" : "p-4",
            ].join(" ")}
        >
            <div
                className={[
                    "mx-auto flex flex-col items-stretch",
                    compact ? "max-w-44 gap-3" : "max-w-xs gap-4",
                ].join(" ")}
            >
                <div
                    className={[
                        "rounded-2xl bg-white shadow-sm",
                        compact ? "p-3" : "p-4",
                    ].join(" ")}
                >
                    <QRCodeSVG
                        value={instagramUrl}
                        size={compact ? 144 : 224}
                        marginSize={1}
                        level="M"
                        className="h-auto w-full"
                        aria-label="Instagram DM QR code"
                    />
                </div>
                <button
                    type="button"
                    onClick={onOpen}
                    disabled={disabled}
                    className="btn-primary w-full"
                >
                    <FiExternalLink className="h-4 w-4" aria-hidden="true" />
                    {compact ? "Open DM" : "Open Instagram DM"}
                </button>
            </div>
        </div>
    );
}
