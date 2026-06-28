This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Transactional email

Brevo notifications are sent server-side and require these deployment variables:

```bash
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME="Vee’s Nail Studio"
ADMIN_NOTIFICATION_EMAIL=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
```

When Brevo is not configured, email attempts are safely recorded as `failed`
and can be retried after configuration is fixed. Bookings without an email
recipient are recorded as `skipped` without calling Brevo.

Vercel calls `/api/cron/appointment-reminders` daily at 12:00 UTC. The route requires
`Authorization: Bearer <CRON_SECRET>` and sends one deduplicated reminder for
confirmed appointments on the next studio-calendar day.

See [the transactional email matrix](docs/email-notifications.md) for client
emails, admin copies, notification types, and deduplication keys.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
