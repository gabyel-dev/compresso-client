import { motion as Motion } from "framer-motion";
import { UploadFile } from "@duo-icons/react";
import appConfig from "../config/app.config";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative w-full shrink-0 overflow-hidden px-4 pb-16 pt-24"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-6 h-52 w-52 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute -right-10 top-24 h-56 w-56 rounded-full bg-blue-300/35 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-5 inline-flex items-center rounded-full border border-blue-100 bg-white/90 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            {appConfig.appName} • Fast, Free, Simple
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Shrink Video Size
            <span className="text-blue-600"> Without Looking Worse</span>
            <br className="hidden md:inline" />
            in a Smooth 3-Step Flow
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            Upload your video, choose target size and quality, then download a
            smaller file with dependable output and clear progress.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#compressor"
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-600/35 transition-all hover:bg-blue-700 active:scale-95"
            >
              <UploadFile className="h-5 w-5" />
              Upload Video
            </a>

            <a
              href="#how"
              className="rounded-2xl border border-slate-300 bg-white/80 px-7 py-4 font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              See How It Works
            </a>
          </div>
        </Motion.div>
      </div>
    </section>
  );
}
