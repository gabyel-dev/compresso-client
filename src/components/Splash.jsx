import { motion as Motion } from "framer-motion";
import { FaVideo } from "react-icons/fa";

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center text-white z-50">
      <Motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center space-x-4 mb-4"
      >
        <FaVideo className="text-6xl" />
        <h1 className="text-4xl font-bold tracking-tight">Compresso</h1>
      </Motion.div>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <p className="text-blue-200 text-lg font-medium animate-pulse">
          Loading professional compressor...
        </p>
      </Motion.div>
    </div>
  );
}
