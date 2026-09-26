"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { reachGoal } from "@/lib/analytics";
import { MATRIX_PATH } from "@/lib/arcana-paths";

export function CalculatorLink({ className = "button", children }: { className?: string; children: ReactNode }) {
  return (
    <Link className={className} href={MATRIX_PATH} onClick={() => reachGoal("arcana_to_calculator")}>
      {children}
    </Link>
  );
}
