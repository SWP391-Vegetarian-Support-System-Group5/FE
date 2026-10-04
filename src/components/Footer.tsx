import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#EFEEEB] bg-[#F5F3F0] pt-14 pb-8 text-[#07241A]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A2F] text-white">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </span>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#07241A]">
                VeggieMate
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#424844]">
              An editorial sanctuary honoring plant-forward cooking and mindful vegetarian living.
            </p>
          </div>

          {/* Explore column */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-[#07241A]">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-[#424844]">
              <li>
                <Link href="/#recipes" className="transition hover:text-[#07241A]">
                  Recipes & Seasons
                </Link>
              </li>
              <li>
                <Link href="/#recipes" className="transition hover:text-[#07241A]">
                  Culinary Videos
                </Link>
              </li>
              <li>
                <Link href="/#restaurants" className="transition hover:text-[#07241A]">
                  Restaurant Reviews
                </Link>
              </li>
              <li>
                <Link href="/#restaurants" className="transition hover:text-[#07241A]">
                  Vegan Places Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Support column */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-[#07241A]">
              About & Support
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-[#424844]">
              <li>
                <a href="#about" className="transition hover:text-[#07241A]">
                  About Our Journey
                </a>
              </li>
              <li>
                <a href="#contact" className="transition hover:text-[#07241A]">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="transition hover:text-[#07241A]">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="transition hover:text-[#07241A]">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Language & Community */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-[#07241A]">
              Language & Community
            </h4>
            <p className="mt-4 text-xs text-[#424844]">
              Select your reading dialect:
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-medium text-[#424844]">
              <span>🌐</span>
              <span>English (EN)</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-[#EFEEEB] pt-6 text-xs text-[#727974] sm:flex-row">
          <p>© 2025 VeggieMate. Crafted for mindful living and plant-forward wellness.</p>
          <p className="mt-2 sm:mt-0 font-serif italic">Embracing seasonal abundance everyday.</p>
        </div>
      </div>
    </footer>
  );
}
