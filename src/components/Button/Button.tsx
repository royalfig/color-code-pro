import { type ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
  icon?: React.ReactNode;
}

export function Button({ variant = "default", icon, children, className, ...props }: ButtonProps) {
  const cls = ["fs-btn", variant === "primary" && "fs-btn-primary", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...props}>
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
}

export function IconButton({ variant = "default", children, className, ...props }: IconButtonProps) {
  const cls = [variant === "ghost" ? "fs-btn-ghost" : "fs-btn-icon", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
  label?: string;
}

export function ButtonGroup({ children, label }: ButtonGroupProps) {
  return (
    <div className="fs-shape-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}
