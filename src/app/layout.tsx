import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

// Public navigation moved into the (public) layout

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Vee's Nail Studio | Book an appointment",
    description:
        "Vee's Nail Studio is run by a certified nail artist in downtown Toronto. Book an appointment today by visiting our website. We offer a wide range of nail services, including manicures, gel nails, and nail art. We are dedicated to providing high-quality services in a clean and welcoming environment. Book your appointment today and let us help you achieve the perfect nails!",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">{children}</body>
        </html>
    );
}
