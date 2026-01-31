"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { decodeEventLog, parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

import { FACTORY_ADDRESS } from "./config";
import { circleCreatedEvent, factoryAbi } from "./abi";
import { saveCircleLabel } from "./circleRegistry";
import { useSelfId } from "@/app/hooks/useSelfId";

const SECONDS_PER_DAY = 86_400;

const defaultFormState = {
  name: "",
  contribution: "50",
  cycleLengthDays: "7",
  maxMembers: "6",
  payoutOrder: "",
};

type FormState = typeof defaultFormState;
type FieldErrors = Partial<Record<keyof FormState, string>>;
type Toast = { id: string; message: string; variant: "success" | "error" };

export function CreateCircleDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { isConnected } = useAccount();
  const {
    isLinked,
    reputationScore,
    attestations,
    verificationData,
    linkSelfId,
    isLinking,
    isSubmittingOnchain,
  } = useSelfId();
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pendingLabelRef = useRef<string>("");

  const isVerified = isLinked && Boolean(verificationData);

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: txSuccess,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const pushToast = useCallback((message: string, variant: Toast["variant"]) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${variant}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (writeError) {
      pushToast(writeError.message || "Transaction failed", "error");
    }
  }, [writeError, pushToast]);

  useEffect(() => {
    if (txSuccess) {
      if (receipt) {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({ abi: [circleCreatedEvent], data: log.data, topics: log.topics });
            if (decoded.eventName === "CircleCreated") {
              const circleAddress = decoded.args.circle as string;
              const label = pendingLabelRef.current || form.name || `Circle ${Date.now()}`;
              saveCircleLabel(circleAddress, label);
            }
          } catch {
            // ignore non-matching logs
          }
        }
      }
      setForm(defaultFormState);
      setFieldErrors({});
      setFormError(null);
      pushToast("Circle deployed successfully", "success");
      onCreated?.();
      onClose();
    }
  }, [txSuccess, receipt, form.name, onClose, onCreated, pushToast]);

  const isBusy = isPending || isConfirming;

  const parsedMaxMembers = Number(form.maxMembers || "0");
  const parsedCycleDays = Number(form.cycleLengthDays || "0");
  const parsedContribution = Number(form.contribution || "0");

  const payoutPreview = useMemo(() => {
    if (form.payoutOrder.trim().length > 0) {
      return form.payoutOrder
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => value > 0)
        .join(" → ");
    }

    if (parsedMaxMembers > 0) {
      return Array.from({ length: parsedMaxMembers }, (_, idx) => idx + 1).join(" → ");
    }

    return "—";
  }, [form.payoutOrder, parsedMaxMembers]);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!isConnected) {
      setFormError("Connect your wallet to deploy a circle.");
      return;
    }

    const errors: FieldErrors = {};

    if (!form.name.trim()) {
      errors.name = "Circle label is required.";
    }

    if (parsedContribution <= 0) {
      errors.contribution = "Contribution must be greater than zero.";
    }

    // Require Self Protocol verification for contributions above 10 cUSD
    if (parsedContribution > 10 && !isVerified) {
      setFormError("Self Protocol verification required for contributions above 10 cUSD.");
      return;
    }

    if (parsedCycleDays <= 0) {
      errors.cycleLengthDays = "Cycle must be at least 1 day.";
    }

    if (!Number.isInteger(parsedMaxMembers) || parsedMaxMembers <= 1) {
      errors.maxMembers = "Need at least two members.";
    }

    const payoutTokens = form.payoutOrder.trim().length > 0
      ? form.payoutOrder.split(",").map((value) => Number(value.trim()))
      : Array.from({ length: parsedMaxMembers }, (_, idx) => idx + 1);

    const payoutOrderArray = payoutTokens.filter((value) => Number.isInteger(value) && value > 0).slice(0, parsedMaxMembers);

    if (payoutOrderArray.length !== parsedMaxMembers) {
      errors.payoutOrder = "List every member position exactly once.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    pendingLabelRef.current = form.name.trim();

    const payoutOrderBigInt = payoutOrderArray.map((value) => BigInt(value));

    try {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "createCircle",
        args: [
          parseUnits(form.contribution, 18),
          BigInt(parsedCycleDays * SECONDS_PER_DAY),
          BigInt(parsedMaxMembers),
          payoutOrderBigInt,
        ],
      });
    } catch (contractError) {
      const message = (contractError as Error).message;
      setFormError(message);
      pushToast(message, "error");
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-3 sm:px-4 py-4 sm:py-6 lg:py-10 overflow-y-auto">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed right-3 sm:right-4 lg:right-6 top-3 sm:top-4 lg:top-6 space-y-2 z-[60] max-w-[calc(100vw-1.5rem)] sm:max-w-md">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm shadow-lg break-words ${
                toast.variant === "success" 
                  ? "bg-emerald-500/90 text-emerald-950" 
                  : "bg-rose-500/90 text-rose-950"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/95 p-4 sm:p-6 lg:p-8 text-white shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-cyan-200">
              New circle
            </p>
            <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-semibold">
              Design your rotation
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Set contribution, cadence, and member cap in one go.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-full border border-white/20 p-2 sm:px-3 sm:py-1 text-slate-300 hover:border-white/40 hover:bg-white/5 transition-colors"
            disabled={isBusy}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline text-sm">Close</span>
          </button>
        </div>

        <form className="mt-4 sm:mt-6 space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
          {/* Self Protocol Verification Status */}
          {parsedContribution > 10 && (
            <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
              isVerified 
                ? "border-emerald-500/30 bg-emerald-500/10" 
                : "border-amber-500/30 bg-amber-500/10"
            }`}>
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                {isVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-emerald-200">
                        Verified with Self Protocol
                      </p>
                      <p className="text-xs text-emerald-300/80 mt-0.5">
                        Reputation {reputationScore} · Attestations {attestations}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-amber-200">
                        Verification required
                      </p>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Link your Self ID before creating circles above 10 cUSD
                      </p>
                    </div>
                  </>
                )}
              </div>
              {!isVerified && (
                <button
                  type="button"
                  onClick={linkSelfId}
                  className="mt-2 sm:mt-3 w-full rounded-full bg-amber-500 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-950 transition hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isLinking || isSubmittingOnchain || !isConnected}
                >
                  {isLinking ? "Launching Self" : "Verify with Self Protocol"}
                </button>
              )}
            </div>
          )}

          {/* Circle Label */}
          <label className="block text-xs sm:text-sm">
            <span className="text-slate-300">Circle label (for your dashboard)</span>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Sunrise Rotations"
              className="mt-1.5 sm:mt-2 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
              disabled={isBusy}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-300">{fieldErrors.name}</p>
            )}
          </label>

          {/* Grid Inputs */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <label className="text-xs sm:text-sm">
              <span className="text-slate-300">Contribution (cUSD)</span>
              <input
                type="number"
                min="1"
                step="0.1"
                value={form.contribution}
                onChange={handleChange("contribution")}
                className="mt-1.5 sm:mt-2 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                disabled={isBusy}
              />
              {fieldErrors.contribution && (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.contribution}</p>
              )}
            </label>

            <label className="text-xs sm:text-sm">
              <span className="text-slate-300">Cycle length (days)</span>
              <input
                type="number"
                min="1"
                value={form.cycleLengthDays}
                onChange={handleChange("cycleLengthDays")}
                className="mt-1.5 sm:mt-2 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                disabled={isBusy}
              />
              {fieldErrors.cycleLengthDays && (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.cycleLengthDays}</p>
              )}
            </label>

            <label className="text-xs sm:text-sm">
              <span className="text-slate-300">Max members</span>
              <input
                type="number"
                min="2"
                value={form.maxMembers}
                onChange={handleChange("maxMembers")}
                className="mt-1.5 sm:mt-2 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                disabled={isBusy}
              />
              {fieldErrors.maxMembers && (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.maxMembers}</p>
              )}
            </label>
          </div>

          {/* Payout Order */}
          <label className="block text-xs sm:text-sm">
            <span className="text-slate-300">Custom payout order (comma separated, optional)</span>
            <input
              type="text"
              value={form.payoutOrder}
              onChange={handleChange("payoutOrder")}
              placeholder="1,2,3,4"
              className="mt-1.5 sm:mt-2 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
              disabled={isBusy}
            />
            {fieldErrors.payoutOrder && (
              <p className="mt-1 text-xs text-rose-300">{fieldErrors.payoutOrder}</p>
            )}
          </label>

          {/* Preview */}
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/40 p-3 sm:p-4 text-xs sm:text-sm text-slate-300">
            <p className="font-semibold text-white">Rotation preview</p>
            <p className="mt-1 text-slate-400 break-all">{payoutPreview}</p>
          </div>

          {/* Form Error */}
          {formError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs sm:text-sm text-rose-300">
              {formError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-900 transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            disabled={isBusy}
          >
            {isPending && "Confirm in wallet…"}
            {isConfirming && !isPending && "Waiting for finality…"}
            {!isBusy && "Deploy circle"}
          </button>

          {/* Transaction Hash */}
          {txHash && (
            <p className="text-center text-xs text-slate-500 break-all">
              Tx hash: <span className="font-mono">{txHash}</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
