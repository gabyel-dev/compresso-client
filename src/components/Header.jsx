import { FaVideo } from "react-icons/fa";

export default function Header() {
  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it Works" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <a href="#home" className="group flex items-center gap-3 text-blue-600">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <FaVideo className="text-lg" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Compresso
          </span>
          <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-700 group-hover:bg-blue-100 lg:block">
            Free forever
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#compressor"
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 md:px-4 md:text-sm"
        >
          Upload Video
        </a>
      </div>
    </header>
  );
}
