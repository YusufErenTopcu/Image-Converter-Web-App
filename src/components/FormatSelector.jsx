export function FormatSelector({ value, onChange, options }) {
  return (
    <div className="field">
      <label className="label" htmlFor="outputFormat">
        Output format
      </label>
      <select
        id="outputFormat"
        className="select"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {(options || []).map((opt) => (
          <option key={opt.key} value={opt.key} disabled={!opt.supported}>
            {opt.label}
            {!opt.supported ? ' (unsupported)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
