import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ToastProvider from "@/components/toast/ToastProvider";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Book an Appointment | Vee's Nail Studio",
    description:
        "Book your Vee's Nail Studio appointment through the secure online booking portal.",

    applicationName: "Book | Vee's Nails",
    appleWebApp: {
        title: "Book | Vee's Nails",
        capable: true,
        statusBarStyle: "default",
    },
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_BASE_URL || "https://booking.veenailstudio.ca",
    ),
    alternates: {
        canonical: "/",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}
