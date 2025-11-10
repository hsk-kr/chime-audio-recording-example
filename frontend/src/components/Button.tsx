import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type ButtonProps = {
  color?: "primary" | "danger";
  variant?: "fill" | "outline";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  color = "primary",
  variant = "fill",
  className: _className,
  ...rest
}: ButtonProps) {
  const className =
    "px-4 py-2 rounded-lg cursor-pointer hover:opacity-95 hover:scale-[1.03] transition-all text-sm";

  const colors: Record<typeof color, string> = {
    primary:
      variant === "fill"
        ? "bg-teal-500 text-white"
        : "border border-teal-500 text-teal-500 bg-[#1C1C1C]",
    danger:
      variant === "fill"
        ? "bg-red-500 text-white"
        : "border border-red-500 text-red-500 bg-[#1C1C1C]",
  };

  return (
    <button
      className={twMerge(
        colors[color],
        className,
        rest.disabled
          ? "disabled:bg-gray-400 disabled:text-zinc-50 opacity-70 pointer-events-none"
          : "",
        _className,
      )}
      {...rest}
    />
  );
}
