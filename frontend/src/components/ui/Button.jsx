import React from "react";

/**
 * Bouton polymorphique avec variants et tailles.
 * Supporte `asChild` pour fusionner avec un élément enfant (Link, a, etc.).
 */
export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default:
      "button-default bg-primary-deep text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95",
    outline: "border border-border bg-background hover:bg-muted",
    ghost: "hover:bg-muted",
    secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
    destructive: "bg-error text-white shadow-sm hover:bg-error/90",
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
    const childProps = children.props;

    // Fusion sûre des handlers pour éviter les collisions
    const mergedProps = {
      ...props,
      className: `${classes} ${childProps.className || ""}`.trim(),
    };

    // Préserver les event handlers de l'enfant
    ["onClick", "onKeyDown", "onKeyUp", "onFocus", "onBlur"].forEach((eventName) => {
      if (typeof childProps[eventName] === "function" || typeof props[eventName] === "function") {
        mergedProps[eventName] = (event) => {
          childProps[eventName]?.(event);
          if (!event.defaultPrevented) {
            props[eventName]?.(event);
          }
        };
      }
    });

    return React.cloneElement(children, mergedProps);
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
