import { useState, useEffect } from "react";
import Splash from "./components/Splash";
import Header from "./components/Header";
import Hero from "./components/Hero";
import CompressorPanel from "./components/CompressorPanel";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Splash />;
  }

  return (
    <div className="relative min-h-screen flex w-full flex-col text-slate-900 font-sans">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(to_bottom,#f8fbff,#f2f7ff)]" />
      <Header />
      <main className="flex flex-1 flex-col items-center overflow-x-clip">
        <Hero />
        <CompressorPanel />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}

export default App;
