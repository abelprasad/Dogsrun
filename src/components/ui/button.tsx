import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "sm";

const sizes: Record<ButtonSize, string> = {
  md: "px-6 py-3 text-sm",
  sm: "px-4 py-2 text-xs",
};

const solidBase = (size: ButtonSize) =>
  `inline-flex items-center justify-center ${sizes[size]} font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50`;

const variantClasses: Record<ButtonVariant, (size: ButtonSize) => string> = {
  primary: (size) => `${solidBase(size)} bg-[#f4b942] text-[#1a2e1a] hover:bg-[#ffd86a]`,
  secondary: (size) =>
    `${solidBase(size)} border border-[#13241d]/20 bg-[#fff9ef] text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942]`,
  danger: (size) => `${solidBase(size)} bg-red-600 text-white hover:bg-red-700`,
  // Link-style: callers supply their own size/weight via className.
  ghost: () => "text-[#d95f4b] transition hover:underline disabled:opacity-50",
};

type ButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
};
type ButtonAsLink = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export type ButtonProps = (ButtonAsButton | ButtonAsLink) & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = `${variantClasses[variant](size)}${className ? ` ${className}` : ""}`;

  if ("href" in props && props.href) {
    const { href, ...anchorProps } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...(rest as ButtonAsButton)}>
      {children}
    </button>
  );
}
