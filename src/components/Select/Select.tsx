import { type SelectHTMLAttributes } from "react";
import "./Select.css";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "lg";
}

export function Select({ size, className, ...props }: SelectProps) {
  const cls = [
    "fs-select",
    size === "sm" && "fs-select--sm",
    size === "lg" && "fs-select--lg",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <select className={cls} {...props} />;
}
