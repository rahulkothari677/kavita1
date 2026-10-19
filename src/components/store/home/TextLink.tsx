import Link from "next/link";

/**
 * Underlined text link with a trailing arrow ("Commission a piece →").
 * The outer element pads the hit area to 44px; the underline stays tight to the text.
 */
export function TextLink({
  href,
  children,
  icon,
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = `inline-flex min-h-11 items-center gap-2 text-[15px] font-medium ${className}`;
  const inner = (
    <>
      {icon}
      <span className="link">
        {children}{" "}
        <span aria-hidden className="arrow">
          →
        </span>
      </span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
