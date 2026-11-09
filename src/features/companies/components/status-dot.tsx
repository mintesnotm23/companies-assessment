import type { CompanyStatus } from "@/lib/api/schema";

const DOT_COLOR: Record<CompanyStatus, string> = {
  new: "bg-sky-500",
  researching: "bg-violet-500",
  contacted: "bg-amber-500",
  qualified: "bg-emerald-500",
  rejected: "bg-rose-500",
};

export function StatusDot({ status }: { status: CompanyStatus | null }) {
  return (
    <span
      aria-hidden
      className={`size-2 shrink-0 rounded-full ${status ? DOT_COLOR[status] : "border border-gray-400"}`}
    />
  );
}
