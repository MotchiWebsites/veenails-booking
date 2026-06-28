import { updateBookingSettingsAction } from "@/features/admin/settings/actions/admin-settings";
import type { AdminBookingSettings } from "@/features/admin/settings/data/admin-settings";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";

export default function AdminSettingsPage({
    settings,
}: {
    settings: AdminBookingSettings | null;
}) {
    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <AdminPageHeader
                eyebrow="Admin"
                title="Settings"
                description="Manage booking, priority access, payment, and studio arrival settings."
            />
            {settings ? (
                <form
                    action={updateBookingSettingsAction}
                    className="mt-6 grid gap-4 xl:grid-cols-2"
                >
                    <input type="hidden" name="id" value={settings.id} />
                    <label className="space-y-2">
                        <span className="label-text">Deposit amount</span>
                        <input
                            className="input-field"
                            name="depositAmount"
                            type="number"
                            step="0.01"
                            defaultValue={settings.deposit_amount}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Booking fee rate</span>
                        <input
                            className="input-field"
                            name="bookingFeeRate"
                            type="number"
                            step="0.01"
                            defaultValue={settings.booking_fee_rate}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Booking fee mode</span>
                        <select
                            className="input-field"
                            name="bookingFeeMode"
                            defaultValue={settings.booking_fee_mode}
                        >
                            <option value="added_on_top">Added on top</option>
                            <option value="included_in_price">
                                Included in price
                            </option>
                        </select>
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">
                            Regulars early access (hours)
                        </span>
                        <input
                            className="input-field"
                            name="regularEarlyAccessHours"
                            type="number"
                            step="1"
                            min="0"
                            max="168"
                            defaultValue={settings.regular_early_access_hours}
                        />
                        <span className="block text-xs text-muted">
                            Priority slots become public after this many hours.
                        </span>
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Hold minutes</span>
                        <input
                            className="input-field"
                            name="holdMinutes"
                            type="number"
                            step="1"
                            defaultValue={settings.hold_minutes}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">E-transfer email</span>
                        <input
                            className="input-field"
                            name="etransferEmail"
                            type="email"
                            defaultValue={settings.etransfer_email ?? ""}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Instagram DM URL</span>
                        <input
                            className="input-field"
                            name="instagramUrl"
                            type="url"
                            defaultValue={settings.instagram_url ?? ""}
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Studio address</span>
                        <input
                            className="input-field"
                            name="studioAddress"
                            type="text"
                            defaultValue={settings.studio_address ?? ""}
                        />
                        <span className="block text-xs text-muted">
                            Shown to confirmed clients before their appointment.
                        </span>
                    </label>
                    <label className="space-y-2">
                        <span className="label-text">Buzzer code</span>
                        <input
                            className="input-field"
                            name="studioBuzzerCode"
                            type="text"
                            autoComplete="off"
                            defaultValue={settings.studio_buzzer_code ?? ""}
                        />
                        <span className="block text-xs text-muted">
                            Shown only to confirmed clients and included in
                            reminders.
                        </span>
                    </label>
                    <div className="xl:col-span-2">
                        <button type="submit" className="btn-primary">
                            Save settings
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mt-5 text-sm text-muted">
                    Booking settings are not configured yet.
                </p>
            )}
        </section>
    );
}
