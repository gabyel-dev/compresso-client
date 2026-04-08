import { Clapperboard } from "@duo-icons/react";
import appConfig from "../config/app.config";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-12">
      <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-white">
          <Clapperboard className="text-2xl" />
          <span className="text-xl font-bold tracking-tight">
            {appConfig.appName}
          </span>
        </div>
        <p className="text-sm text-center">
          Maximum upload limit is {appConfig.maxUploadSizeLabel}. Compress
          videos for free with no account required.
        </p>
        <div className="flex items-center justify-center gap-6">
          <a href="#" className="hover:text-white transition-colors text-sm">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white transition-colors text-sm">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
