import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ToastProvider from "@/components/shared/toast/ToastProvider";
import "./globals.css";
import { buildMetadata, siteConfig } from "@/lib/seo/metadata";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = buildMetadata({
    title: `Book an Appointment`,
    description:
        "Book and manage your Vee's Nail Studio appointments through a secure online booking portal.",
    path: "/",
    image: siteConfig.defaultImage,
});

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
