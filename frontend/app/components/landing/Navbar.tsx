"use client";

import { AppKitButton } from "@reown/appkit/react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { celo } from "wagmi/chains";

export function Navbar() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onSupportedChain = typeof chainId === "number" && chainId === celo.id;

  return (
    <motion.nav
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-10 lg:py-4">
        <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-[0_12px_30px_rgba(34,211,238,0.55)]">
            <Zap className="h-5 w-5 text-slate-950" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white sm:text-lg">Ajo</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-slate-300 transition hover:text-white hover:underline hover:underline-offset-4"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-slate-300 transition hover:text-white hover:underline hover:underline-offset-4"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-sm text-slate-300 transition hover:text-white hover:underline hover:underline-offset-4"
          >
            FAQ
          </a>
          {isConnected && onSupportedChain && (
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-200 shadow-[0_10px_30px_rgba(8,47,73,0.6)] transition hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-50"
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="shrink-0">
          <AppKitButton />
        </div>
      </div>
    </motion.nav>
  );
}
