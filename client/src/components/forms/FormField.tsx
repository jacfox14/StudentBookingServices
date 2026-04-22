import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  as?: "input" | "textarea" | "select";
  children?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, as = "input", children, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
        {as === "textarea" ? (
          <textarea
            id={inputId}
            className={`form-control ${error ? "is-invalid" : ""}`}
            {...(rest as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : as === "select" ? (
          <select
            id={inputId}
            className={`form-control ${error ? "is-invalid" : ""}`}
            {...(rest as unknown as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        ) : (
          <input
            id={inputId}
            ref={ref}
            className={`form-control ${error ? "is-invalid" : ""}`}
            {...rest}
          />
        )}
        {hint && !error && <div className="form-hint">{hint}</div>}
        {error && (
          <div className="field-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";
