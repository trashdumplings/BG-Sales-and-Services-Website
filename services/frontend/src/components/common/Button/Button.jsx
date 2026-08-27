import './Button.css'

export default function Button({
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = ['btn', variant, size, loading ? 'is-loading' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className="btn__label">{children}</span>
    </button>
  )
}
