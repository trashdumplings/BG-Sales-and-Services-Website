import './FormField.css'

export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  validating = false,
  children,
}) {
  return (
    <div className="form-field">
      {label ? (
        <label className="form-field__label" htmlFor={htmlFor}>
          {label} {required ? <span className="form-field__required">*</span> : null}
        </label>
      ) : null}

      <div className="form-field__control">
        {children}
        {validating ? <span className="form-field__spinner" aria-hidden="true" /> : null}
      </div>

      {error ? (
        <p className="form-field__error" role="alert">{error}</p>
      ) : hint ? (
        <p className="form-field__hint">{hint}</p>
      ) : null}
    </div>
  )
}
