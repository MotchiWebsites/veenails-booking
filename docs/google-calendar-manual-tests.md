# Google Calendar manual verification

Use a dedicated writable Google calendar and keep the Supabase table editor open
for `availability_slots` and `bookings`.

## Slot lifecycle

1. Create one future availability slot.
2. Confirm that Google Calendar contains exactly one transparent
   `Available slot — Vee’s Nail Studio` event.
3. Record its Google event ID from
   `availability_slots.google_calendar_event_id`.
4. Book and confirm that slot.
5. Confirm that:
   - Google Calendar still contains exactly one event for the lifecycle.
   - The original event title leads with the client and a concise service
     summary, such as `Taylor · Structured Gel Manicure +1 more`.
   - It is opaque/busy and has popup reminders at 1,440 and 30 minutes.
   - The slot and booking rows contain the same event ID recorded in step 3.
6. Retry the confirmation/sync action and confirm that no second event appears.
7. Try to create another active slot at the same start time, with the optional
   end time left blank. Confirm that creation is rejected with
   `That time overlaps another active slot.` and that no second database row or
   Google event is created.
8. Create a slot without an end time and confirm that its Google Calendar event
   ends four hours after it starts.

## Reschedule

1. Reschedule the confirmed booking to another future slot.
2. Confirm that the same booking event ID moves to the new time.
3. Confirm that the destination slot’s previous availability event is removed.
4. Confirm that the old slot has one replacement transparent availability event.

## Cancel and reopen

1. Cancel a future confirmed booking so its slot reopens.
2. Confirm that the same booking event becomes a transparent available-slot
   event.
3. Confirm that the slot and cancelled booking retain the same Google event ID.
4. Cancel a past/non-reopened booking and confirm that its event is deleted and
   both stored event IDs are cleared.

## Calendar selection

1. Open Admin → Settings → Google Calendar and choose a non-primary writable
   calendar.
2. Click **Use this calendar**.
3. Confirm that the picker closes, the card immediately displays the selected
   calendar name, and a success toast appears.
4. Refresh the page and confirm that the same calendar remains selected.
5. Remove the connected account’s access to that calendar, reload Settings, and
   confirm that the card requests a new selection without reverting to Primary.

## Safe server logs

For lifecycle operations, confirm that server logs contain structured
`google-calendar:event-resolution` decisions such as `create`, `update`,
`replace_missing`, or `remove_duplicate`. Logs must not contain OAuth codes,
access tokens, refresh tokens, client secrets, or authorization headers.
