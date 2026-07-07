/** Circular avatar: shows photo if URL set, otherwise shows coloured initials. */
export function Avatar({
  name,
  url,
  size = "sm",
  className = "",
}: {
  name: string;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];

  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border border-line shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-blue-soft border border-line flex items-center justify-center font-bold text-blue-ink shrink-0 ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
