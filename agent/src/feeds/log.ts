// ─── Decision Log ─────────────────────────────────────────────
// Ring buffer of the agent's autonomous decisions for dashboard display.

import { nanoid } from "nanoid";
import type { DecisionLogEntry, PaymentRecord } from "../types.js";

const MAX_ENTRIES = 200;
const MAX_PAYMENTS = 500;

export class DecisionLog {
  private entries: DecisionLogEntry[] = [];
  private payments: PaymentRecord[] = [];

  /** Add a decision entry. */
  addEntry(
    type: DecisionLogEntry["type"],
    message: string,
    metadata?: Record<string, unknown>,
  ): DecisionLogEntry {
    const entry: DecisionLogEntry = {
      id: nanoid(8),
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata,
    };
    this.entries.unshift(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.length = MAX_ENTRIES;
    }
    return entry;
  }

  /** Add a payment record. */
  addPayment(
    direction: PaymentRecord["direction"],
    amount_usdc: number,
    service: string,
    tx_hash?: string,
  ): PaymentRecord {
    const payment: PaymentRecord = {
      id: nanoid(8),
      timestamp: new Date().toISOString(),
      direction,
      amount_usdc: Math.round(amount_usdc * 1_000_000) / 1_000_000,
      service,
      tx_hash,
      status: tx_hash ? "settled" : "pending",
    };
    this.payments.unshift(payment);
    if (this.payments.length > MAX_PAYMENTS) {
      this.payments.length = MAX_PAYMENTS;
    }
    return payment;
  }

  /** Get recent entries. */
  getEntries(limit = 50): DecisionLogEntry[] {
    return this.entries.slice(0, limit);
  }

  /** Get recent payments. */
  getPayments(limit = 50): PaymentRecord[] {
    return this.payments.slice(0, limit);
  }

  /** Get total outflow. */
  getTotalOutflow(): number {
    let total = 0;
    for (const p of this.payments) {
      if (p.direction === "outflow" && p.status === "settled") total += p.amount_usdc;
    }
    return Math.round(total * 1_000_000) / 1_000_000;
  }

  /** Get total inflow. */
  getTotalInflow(): number {
    let total = 0;
    for (const p of this.payments) {
      if (p.direction === "inflow" && p.status === "settled") total += p.amount_usdc;
    }
    return Math.round(total * 1_000_000) / 1_000_000;
  }
}
