import {
    FiCalendar,
    FiCreditCard,
    FiGrid,
    FiHeart,
    FiUser,
} from "react-icons/fi";

export const navItems = [
    {
        href: "/dashboard",
        label: "Overview",
        icon: FiGrid,
    },
    {
        href: "/book",
        label: "Book Appointment",
        icon: FiCalendar,
    },
    {
        href: "/booking",
        label: "My Bookings",
        icon: FiHeart,
    },
    {
        href: "/credits",
        label: "Credits",
        icon: FiCreditCard,
    },
    {
        href: "/profile",
        label: "Profile",
        icon: FiUser,
    },
];
