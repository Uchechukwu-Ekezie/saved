"use client";

import { AppKitButton } from "@reown/appkit/react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

import { circles } from "./constants";
import { fadeUp } from "./animations";
import { ChainStatus, CircleCard, PrimaryButton } from "./ui";

export function HeroSection({
  isConnected,
  onSupportedChain,
}: {
  isConnected: boolean;
  onSupportedChain: boolean;
}) {
  return (
    <motion.header className="flex flex-col gap-6 sm:gap-8 lg:gap-10 pt-4 sm:pt-6 lg:pt-8" {...fadeUp}>
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-cyan-300">
            Self-enabled circles
          </p>
          <h1 className="mt-2 sm:mt-3 max-w-3xl bg-gradient-to-r from-slate-50 via-cyan-100 to-emerald-100 bg-clip-text text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-transparent">
            Trust-first group savings for every community on Celo
          </h1>
        </div>
        <div className="shrink-0">
          <AppKitButton />
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(15,23,42,0.85)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-5 sm:gap-6">
          <p className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-slate-200">
            Create verifiable Ajo/Esusu circles, rotate payouts on-chain, and grow shareable
            reputation—all in one elegant flow built for low fees and high trust.
          </p>
          
          <ul className="grid gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300 grid-cols-1 xs:grid-cols-2">
            {["SelfID gated membership", "cUSD smart contracts", "Transparent payouts", "Mobile-perfect UX"].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 hover:border-cyan-400/30 transition"
                >
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-300 shrink-0" />
                  <span className="truncate">{item}</span>
                </li>
              )
            )}
          </ul>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 sm:flex-initial">
              <PrimaryButton label={isConnected ? "Create a circle" : "Connect to begin"} />
            </div>
            <ChainStatus isConnected={isConnected} onSupportedChain={onSupportedChain} />
          </div>
        </div>

        <motion.div
          className="rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-transparent p-4 sm:p-5 lg:p-6"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="text-xs sm:text-sm uppercase tracking-wider text-cyan-200">
            Live circle signal
          </p>
          <div className="mt-3 sm:mt-4 flex flex-col gap-3 sm:gap-4">
            {circles.slice(0, 2).map((circle) => (
              <CircleCard key={circle.name} circle={circle} minimal />
            ))}
            <motion.div
              className="rounded-lg sm:rounded-xl border border-white/10 p-3 sm:p-4"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-xs sm:text-sm text-slate-300">
                Reputation boost in progress…
              </p>
              <div className="mt-1.5 sm:mt-2 flex items-center gap-2 text-xs sm:text-sm text-cyan-200">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>+3 score after cycle completion</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
