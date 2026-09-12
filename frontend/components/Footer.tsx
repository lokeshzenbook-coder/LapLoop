export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                Lap<span className="text-gradient">Loop</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
              The marketplace for used laptops, backpacks-tested and honest-priced.
              laptops changing hands.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li><a href="/" className="hover:text-brand-600 dark:hover:text-brand-400">Browse laptops</a></li>
              <li><a href="/sell" className="hover:text-brand-600 dark:hover:text-brand-400">Sell your laptop</a></li>
              <li><a href="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400">My listings</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Trust & safety</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>All listings reviewed on upload</li>
              <li>Seller identity verified via email</li>
              <li>Meet in person, pay on pickup</li>
              <li>Flag anything suspicious</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-400 sm:flex-row dark:border-zinc-800">
          <span>© {new Date().getFullYear()} LapLoop. Open source, MIT.</span>
          <span>Go · Next.js · PostgreSQL · S3</span>
        </div>
      </div>
    </footer>
  );
}