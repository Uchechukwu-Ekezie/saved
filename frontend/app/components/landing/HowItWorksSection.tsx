"use client";
import { motion } from "framer-motion";
import { fadeUp } from "./animations";
import { howItWorks } from "./constants";
import { SectionHeading } from "./ui";

export function HowItWorksSection() {
  return (
    <motion.section className="space-y-6 sm:space-y-8" {...fadeUp}>
      <SectionHeading
        eyebrow="Flow"
        title="How trusted savings circles run themselves"
        description="From onboarding to payouts, every touchpoint blends identity, incentives, and beautiful motion cues."
      />
      
      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {howItWorks.map(({ icon: Icon, title, description }, index) => (
          <motion.div
            key={title}
            className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 hover:border-cyan-400/30 transition"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-cyan-400/20 ring-1 ring-cyan-400/20">
              <Icon className="h-5 w-5 text-cyan-200" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold text-white">
              {title}
            </h3>
            <p className="mt-1.5 sm:mt-2 text-sm text-slate-300 leading-relaxed">
              {description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
