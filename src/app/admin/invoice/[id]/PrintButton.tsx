"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary btn-sm">
      Print / Save as PDF
    </button>
  );
}
