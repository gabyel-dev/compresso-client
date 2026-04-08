import { motion as Motion } from "framer-motion";
import { Disk, Settings, UploadFile } from "@duo-icons/react";
import appConfig from "../config/app.config";

export default function HowItWorks() {
  const steps = [
    {
      title: "Upload video",
      description: `Select your video file up to ${appConfig.maxUploadSizeLabel} and drag it into our compressor.`,
      icon: <UploadFile className="text-2xl" />,
    },
    {
      title: "Choose settings",
      description:
        "Pick target file size, resolution, and quality to compress specifically for your needs.",
      icon: <Settings className="text-2xl" />,
    },
    {
      title: "Download file",
      description:
        "Wait for processing to complete and securely download the optimized video.",
      icon: <Disk className="text-2xl" />,
    },
  ];

  return (
    <section
      id="how"
      className="w-full py-24 bg-slate-50 border-t border-slate-100"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center justify-center flex flex-col mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Compress your video directly in your browser with three simple
            steps.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {steps.map((step, idx) => (
            <Motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform relative"
            >
              <div className="w-16 h-16 bg-blue-200 text-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
