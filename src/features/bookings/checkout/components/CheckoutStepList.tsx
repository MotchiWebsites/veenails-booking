import HorizontalStepNav from "@/components/shared/ui/HorizontalStepNav";

export const checkoutSteps = [
    { id: "summary", label: "Review appointment" },
    { id: "policies", label: "Accept policies" },
    { id: "credits", label: "Apply credits" },
    { id: "deposit", label: "Send deposit" },
    { id: "submit", label: "Submit request" },
] as const;

export type CheckoutStepId = (typeof checkoutSteps)[number]["id"];

export default function CheckoutStepList({
    activeStep,
    maxVisitedStepIndex,
    onStepClick,
}: {
    activeStep: CheckoutStepId;
    maxVisitedStepIndex: number;
    onStepClick: (step: CheckoutStepId) => void;
}) {
    return (
        <HorizontalStepNav
            items={checkoutSteps}
            activeKey={activeStep}
            getKey={(step) => step.id}
            sectionClassName="p-4"
            itemClassName="w-56 shrink-0 sm:w-60"
            renderItem={(step, index) => {
                const current = activeStep === step.id;
                const complete =
                    checkoutSteps.findIndex((item) => item.id === activeStep) >
                    index;
                const reachable = index <= maxVisitedStepIndex;

                return (
                    <button
                        type="button"
                        disabled={!reachable}
                        aria-current={current ? "step" : undefined}
                        onClick={() => onStepClick(step.id)}
                        className={[
                            "flex h-full min-h-16 w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                            current
                                ? "border-pink-300 bg-pink-50"
                                : complete
                                  ? "border-green-200 bg-green-50"
                                  : "border-border/60 bg-background",
                            reachable
                                ? "clickable hover:border-pink-200 hover:bg-pink-50/70"
                                : "cursor-not-allowed opacity-60",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                current
                                    ? "bg-pink-main text-white"
                                    : complete
                                      ? "bg-green-500 text-white"
                                      : "bg-pink-50 text-pink-main",
                            ].join(" ")}
                        >
                            {index + 1}
                        </span>
                        <span className="text-sm font-medium leading-snug text-foreground">
                            {step.label}
                        </span>
                    </button>
                );
            }}
        />
    );
}
