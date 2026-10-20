import { SkeletonRows } from "@/components/admin/pages/kit";

/** Shown the instant an admin menu item is tapped, so switching sections never feels stuck. */
export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 md:mb-8">
        <div className="h-7 w-44 animate-pulse rounded-[6px] bg-admin-sidebar" />
        <div className="mt-2.5 h-3.5 w-64 animate-pulse rounded-[6px] bg-admin-sidebar" />
      </div>
      <SkeletonRows rows={6} />
    </div>
  );
}
