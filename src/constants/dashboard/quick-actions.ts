import { FiCalendar, FiHeart, FiUser } from "react-icons/fi";

export const quickActions = [
    {
        title: "Book an appointment",
        description: "Choose an available time and request your next set.",
        href: "/book",
        icon: FiCalendar,
    },
    {
        title: "View bookings",
        description: "Check requested, confirmed, or completed appointments.",
        href: "/booking",
        icon: FiHeart,
    },
    {
        title: "Update profile",
        description: "Keep your name and phone number up to date.",
        href: "/profile",
        icon: FiUser,
    },
];
