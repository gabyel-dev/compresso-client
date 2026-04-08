import { Approved, File, Rocket, UserCard } from "@duo-icons/react";
import appConfig from "../config/app.config";

const features = [
  {
    title: "Fast compression",
    description:
      "Lightning fast processing times with cutting-edge web compression technology.",
    icon: <Rocket className="text-blue-600 text-xl" />,
  },
  {
    title: "No signup required",
    description:
      "Start compressing immediately. We don't ask for an account or email.",
    icon: <UserCard className="text-blue-600 text-xl" />,
  },
  {
    title: "Secure file handling",
    description:
      "Your files are compressed securely and deleted from our servers automatically.",
    icon: <Approved className="text-blue-600 text-xl" />,
  },
  {
    title: "Supports all formats",
    description: `Upload ${appConfig.acceptedFormatsLabel}. We handle almost any file type.`,
    icon: <File className="text-blue-600 text-xl" />,
  },
];

export default function Features() {
  return (
    <section id="features" className="w-full py-24 bg-white">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Why use {appConfig.appName}?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {appConfig.appName} is focused on one job: reducing video size while
            keeping the experience clean and easy.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
