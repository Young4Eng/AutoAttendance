interface Props {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
}

export function ReasonField({ value, onChange, required, disabled, error }: Props) {
  return (
    <label className="field ReasonField">
      <span>
        사유{required ? ' (필수)' : ''}
      </span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        placeholder={required ? '기타는 사유 필수' : '선택'}
      />
      {error ? <span className="error tiny">{error}</span> : null}
    </label>
  );
}
