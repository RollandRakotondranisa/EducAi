import React from "react";

/**
 * Case à cocher native stylisée avec accent couleur primaire.
 */
export function Checkbox({ id, checked, onChange, ...props }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="
        size-4
        rounded
        border border-input
        accent-[var(--color-primary-deep)]
      "
      {...props}
    />
  );
}