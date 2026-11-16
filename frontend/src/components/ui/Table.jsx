import React from "react";

export function Table({ className = "", ...props }) {
  return (
    <table className={`w-full caption-bottom border-collapse text-sm ${className}`} {...props} />
  );
}

export function TableHeader({ className = "", ...props }) {
  return <thead className={`[&_tr]:border-b [&_tr]:border-border ${className}`} {...props} />;
}

export function TableBody({ className = "", ...props }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />;
}

export function TableRow({ className = "", ...props }) {
  return (
    <tr
      className={`border-b border-border transition-colors hover:bg-muted/50 ${className}`}
      {...props}
    />
  );
}

export function TableHead({ className = "", ...props }) {
  return (
    <th
      className={`h-11 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = "", ...props }) {
  return <td className={`px-3 py-3.5 align-middle ${className}`} {...props} />;
}