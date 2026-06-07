import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { quickActions } from "@/constants/dashboard/quick-actions";

export default function QuickActions() {
    return (
        <section>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold sm:text-2xl">
                        Quick actions
                    </h2>
                    <p className="mt-1 text-sm text-muted sm:text-base">
                        
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group rounded-3xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-surface-2"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-main">
                                <Icon className="h-5 w-5" />
                            </div>

                            <h3 className="mt-5 text-base font-semibold sm:text-lg">
                                {action.title}
                            </h3>

                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {action.description}
                            </p>

                            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pink-main">
                                Continue
                                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
