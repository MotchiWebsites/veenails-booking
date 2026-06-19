export default function BookingDetailsHeader({ title }: { title: string }) {
    return (
        <h2 className="text-xl xl:text-2xl text-pink-main! pb-6 uppercase tracking-[0.22em] text-center font-semibold">
            {title}
        </h2>
    );
}
