import React, { createContext, useContext, useId, useCallback } from "react";
import { Check } from "lucide-react";

const RadioGroupContext = createContext(null);

function useRadioContext() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error(
      "RadioGroupItem doit être utilisé à l'intérieur d'un <RadioGroup>."
    );
  }
  return ctx;
}

export function RadioGroup({
  value,
  onValueChange,
  children,
  className = "",
  orientation = "horizontal",
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
  name,
}) {
  const handleKeyDown = useCallback(
    (event) => {
      if (disabled) return;

      const items = Array.from(
        event.currentTarget.querySelectorAll('[role="radio"]')
      );
      if (items.length === 0) return;

      const currentIndex = items.findIndex(
        (item) => item === document.activeElement
      );

      let nextIndex = -1;
      const lastIndex = items.length - 1;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
          break;
        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          event.preventDefault();
          nextIndex = lastIndex;
          break;
        default:
          return;
      }

      const next = items[nextIndex];
      if (next) {
        next.focus();
        next.click();
      }
    },
    [disabled]
  );

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name, disabled }}>
      <div
        role="radiogroup"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={className}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  value,
  id: explicitId,
  label,
  icon: Icon,
  description,
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const {
    value: groupValue,
    onValueChange,
    name: groupName,
    disabled: groupDisabled,
  } = useRadioContext();

  const autoId = useId();
  const id = explicitId ?? autoId;
  const isDisabled = disabled || groupDisabled;
  const isChecked = groupValue === value;

  const handleClick = () => {
    if (isDisabled) return;
    onValueChange?.(value);
  };

  const handleKeyDown = (event) => {
    if (isDisabled) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onValueChange?.(value);
    }
  };

  const content = children ?? (
    <>
      {Icon && <Icon className="size-4 text-primary-foreground" aria-hidden="true" />}
      <span className="font-medium">{label}</span>
    </>
  );

  return (
    <button
      type="button"
      role="radio"
      id={id}
      aria-checked={isChecked}
      aria-disabled={isDisabled}
      tabIndex={isChecked ? 0 : -1}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`radio-item ${isChecked ? "is-checked" : ""} ${
        isDisabled ? "is-disabled" : ""
      } ${className}`.trim()}
      {...props}
    >
      <input
        type="radio"
        name={groupName}
        value={value}
        checked={isChecked}
        onChange={handleClick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={isDisabled}
      />

      <span className="radio-circle" aria-hidden="true">
        <span className="radio-dot" />
      </span>

      <span className="radio-content">{content}</span>

      {isChecked && (
        <Check className="radio-check size-4 text-primary-foreground" aria-hidden="true" />
      )}
    </button>
  );
}