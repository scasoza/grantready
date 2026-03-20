import AudienceSelector from "./audience-selector";

export default function Home() {
  return (
    <div className="min-h-screen bg-warm-50 text-warm-900 flex flex-col">
      <header className="w-full px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-b from-brand-500 to-brand-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-sm">G</span>
            </div>
            <span className="text-base font-extrabold tracking-tight">GrantReady</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-warm-900">
            Stop leaving money on the table.
          </h1>
          <p className="mt-5 mx-auto text-lg text-warm-500 max-w-lg leading-relaxed">
            Texas childcare providers miss an average of $14,000/yr in funding they already qualify for. See what you are missing — free, 5 minutes, no account required.
          </p>

          <div className="mt-8 flex justify-center">
            <AudienceSelector />
          </div>

          <p className="mt-8 text-sm italic text-warm-500">
            &quot;GrantReady helped me find $18,000 in funding I did not know I qualified for.&quot; — Maria S., Center Director, Houston (42 children)
          </p>
        </div>
      </main>

      <footer className="px-4 sm:px-6 py-6 text-center text-xs text-warm-400">
        © 2026 GrantReady
      </footer>
    </div>
  );
}
