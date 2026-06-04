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
