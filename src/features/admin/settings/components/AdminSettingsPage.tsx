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
                description="Manage booking deposit, fee, hold, e-transfer, and Instagram handoff settings."
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
                        <span className="label-text">Hold minutes</span>
                        <input
                            className="input-field"
                            name="holdMinutes"
                            type="number"
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
