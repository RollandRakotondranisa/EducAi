import React from "react";

export function Checkbox({
  id,
  checked,
  onChange,
  ...props
}) {
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