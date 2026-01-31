"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { celo } from "wagmi/chains";
import { motion } from "framer-motion";
import { AppKitButton } from "@reown/appkit/react";
import { Zap, Menu, X } from "lucide-react";
import { useSelfId } from "@/app/hooks/useSelfId";
import { SelfVerification } from "@/app/components/self/SelfVerification";

import {
  ActionButton,
  ActivityTimeline,
  CircleBoard,
  ContributionTable,
  SummaryGrid,
  type ActivityItem,
  type ContributionEntry,
  type SummaryMetric,
} from "./components";
import { useCirclesData } from "./useCirclesData";
import { CreateCircleDialog } from "./CreateCircleDialog";

const summarySkeleton: SummaryMetric[] = [
  { label: "Total value rotating", value: "…", delta: "" },
  { label: "Reputation score", value: "82", caption: "Aggregated Self attestations" },
  { label: "On-time streak", value: "11 cycles", caption: "Past 90 days" },
];

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onCeloMainnet = typeof chainId === "number" && chainId === celo.id;
  const { circles, aggregate, activities, contributions, isLoading, isError, refetch } = useCirclesData();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const {
    isLinked,
    handle,
    reputationScore,
    attestations,
    showVerification,
    setShowVerification,
    handleVerificationSuccess,
    handleVerificationError,
    isSubmittingOnchain,
  } = useSelfId();

  const verificationStatus = isLinked
    ? `Verified as ${handle ?? "Self ID"}`
    : "Self verification required for high-value circles";

  const summaryMetrics: SummaryMetric[] = [
    {
      label: "Total value rotating",
      value: `${aggregate.headlineValue.toLocaleString()} cUSD`,
      delta: aggregate.totalCircles ? `${aggregate.totalCircles} circles live` : undefined,
    },
    summarySkeleton[1],
    summarySkeleton[2],
  ];

  // Not connected or wrong chain state
  if (!isConnected || !onCeloMainnet) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_55%)]" />
        
        <motion.nav
          className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white">Ajo</span>
            </Link>
            <AppKitButton />
          </div>
        </motion.nav>

        <main className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 text-center">
          <div className="space-y-4 max-w-md">
            <div className="text-4xl sm:text-5xl mb-4">🔒</div>
            <p className="text-xl sm:text-2xl font-semibold">
              Connect on Celo to access your dashboard
            </p>
            <p className="text-sm sm:text-base text-slate-300">
              Use the connect button above, then return here.
            </p>
            <Link 
              href="/" 
              className="inline-block text-cyan-300 underline text-sm sm:text-base hover:text-cyan-200 transition"
            >
              Go back to landing page
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const showContent = !isLoading && !isError && circles.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_55%)]" />
      
      {/* Navigation */}
      <motion.nav
        className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950" />
            </div>
            <span className="text-base sm:text-lg font-bold text-white">Ajo</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <AppKitButton />
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-10">
          
          {/* Header */}
          <motion.header
            className="flex flex-col gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-200">
                  Command center
                </p>
                <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold">
                  Your savings circles
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-400">
                  Create, manage, and track your group savings
                </p>
                <p className={`mt-1.5 sm:mt-2 text-xs ${isLinked ? "text-emerald-300" : "text-amber-300"}`}>
                  {verificationStatus}
                  {isLinked && reputationScore !== undefined && (
                    <span className="block sm:inline sm:ml-2 text-xs text-emerald-200/80 mt-0.5 sm:mt-0">
                      Reputation {reputationScore} · Attestations {attestations}
                    </span>
                  )}
                </p>
              </div>

              {/* Desktop Action Buttons */}
              <div className="hidden sm:flex flex-wrap gap-2 lg:gap-3">
                <ActionButton label="Create circle" onClick={() => setShowCreateDialog(true)} />
                <ActionButton label="Invite member" />
                <ActionButton
                  label={isLinked ? "View verification" : "Verify with Self"}
                  onClick={() => setShowVerification(true)}
                  disabled={isSubmittingOnchain}
                />
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="sm:hidden grid grid-cols-2 gap-2">
              <ActionButton label="Create circle" onClick={() => setShowCreateDialog(true)} />
              <ActionButton
                label={isLinked ? "Verification" : "Verify"}
                onClick={() => setShowVerification(true)}
                disabled={isSubmittingOnchain}
              />
            </div>
          </motion.header>

          {/* Summary Metrics */}
          <SummaryGrid metrics={summaryMetrics} />

          {/* Loading State */}
          {isLoading && (
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 lg:p-10 text-center text-slate-300">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full mb-4" />
              <p className="text-base sm:text-lg font-medium">Fetching your circles…</p>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                We're reading data from the deployed factory.
              </p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-2xl sm:rounded-3xl border border-rose-400/40 bg-rose-500/10 p-4 sm:p-6 text-sm text-rose-100">
              <p className="font-semibold text-sm sm:text-base">Unable to load circles</p>
              <p className="mt-1 text-xs sm:text-sm text-rose-200/80">
                Please ensure the factory address env var is set, then try again.
              </p>
              <button 
                className="mt-3 rounded-full border border-rose-200/40 px-4 py-1.5 text-xs font-semibold hover:bg-rose-500/20 transition" 
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Circle Board */}
          {showContent && <CircleBoard circles={circles} />}

          {/* Empty State */}
          {!isLoading && !isError && circles.length === 0 && (
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 lg:p-10 text-center text-slate-300">
              <div className="text-4xl sm:text-5xl mb-3">🔄</div>
              <p className="text-base sm:text-lg font-medium">No circles found yet</p>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Use the create flow to spin up your first savings circle.
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition"
              >
                Create your first circle
              </button>
            </div>
          )}

          {/* Contribution Table & Activity Timeline */}
          <section className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <ContributionTable rows={contributions as ContributionEntry[]} />
            <ActivityTimeline items={activities as ActivityItem[]} />
          </section>
        </div>

        {/* Dialogs */}
        <CreateCircleDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => refetch()}
        />
        {showVerification && (
          <SelfVerification
            onSuccess={handleVerificationSuccess}
            onError={handleVerificationError}
            onClose={() => setShowVerification(false)}
          />
        )}
      </main>
    </div>
  );
}
