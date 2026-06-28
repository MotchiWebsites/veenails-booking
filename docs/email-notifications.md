# Transactional email matrix

All booking-scoped sends reserve a stable key in `notification_logs` before
calling Brevo. A terminal `pending`, `sent`, or `skipped` row prevents a
duplicate send. Failed sends remain retryable.

| Event | Client email | Admin copy | Deduplication key | Notification type |
| --- | --- | --- | --- | --- |
| Booking request submitted | Yes | BCC when configured | `{bookingId}:booking_requested` | `booking_requested` |
| Admin-created appointment | Yes, when email exists | No | `{bookingId}:admin_booking_created` | `admin_booking_created` |
| Appointment confirmed | Yes | No | `{bookingId}:appointment_confirmed` | `appointment_confirmed` |
| Deposit confirmed without a status change | Yes | No | `{bookingId}:deposit_confirmed` | `deposit_confirmed` |
| Appointment rejected | Yes | No | `{bookingId}:appointment_rejected` | `appointment_rejected` |
| Rejected with credit | One combined email | No | `{bookingId}:appointment_rejected_credit_issued` | `appointment_rejected_credit_issued` |
| Appointment cancelled by studio | Yes | No | `{bookingId}:admin_cancellation` | `admin_cancellation` |
| Cancellation request submitted | Yes | BCC when configured | `{bookingId}:cancellation_request_submitted` | `cancellation_request_submitted` |
| Cancellation request declined | Yes | No | `{bookingId}:cancellation_rejected` | `cancellation_rejected` |
| Credit issued | Yes | No | `credit_issued:{creditId}` | `credit_issued` |
| No-show | Yes | No | `{bookingId}:appointment_no_show` | `appointment_no_show` |
| Appointment completed | Yes | No | `{bookingId}:appointment_completed` | `appointment_completed` |
| 24-hour reminder | Yes | BCC when configured | `{bookingId}:appointment_reminder_24h` | `appointment_reminder_24h` |
| Design inspo ready | Admin only | N/A | `{bookingId}:admin_design_inspo_sent` | `admin_design_inspo_sent` |

If a client email is unavailable, Brevo is not called and the booking-scoped
notification is recorded as `skipped`.
