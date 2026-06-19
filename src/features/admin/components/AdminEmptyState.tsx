export default function AdminEmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background p-5 text-sm text-muted">
            {message}
        </div>
    );
}
