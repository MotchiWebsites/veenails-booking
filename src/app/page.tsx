export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-4xl font-bold">Welcome to Veenails Booking!</h1>
            <p className="mt-4 text-lg text-gray-600">
                Please log in to manage your appointments.
            </p>
            <button className="mt-6 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
                Log In
            </button>
        </main>
    );
}
