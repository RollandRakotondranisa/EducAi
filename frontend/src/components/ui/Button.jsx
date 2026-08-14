import React from "react";

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default:
      "bg-primary-deep text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95",

    outline:
      "border border-border bg-background hover:bg-muted",

    ghost:
      "hover:bg-muted",

    secondary:
      "bg-secondary text-secondary-foreground hover:bg-muted",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-6 text-base",
  };

  const classes = `
    ${base}
    ${variants[variant] || variants.default}
    ${sizes[size] || sizes.default}
    ${className}
  `;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${classes} ${children.props.className || ""}`,
      ...props,
    });
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}