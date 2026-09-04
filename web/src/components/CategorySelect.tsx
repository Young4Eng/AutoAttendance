import type { Category } from '../types/models';
import { CATEGORIES } from '../types/models';
import { CATEGORY_LABELS } from '../lib/labels';

interface Props {
  value: Category;
  onChange: (c: Category) => void;
  disabled?: boolean;
  id?: string;
}

export function CategorySelect({ value, onChange, disabled, id }: Props) {
  return (
    <label className="field compact">
      <span>구분</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Category)}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </label>
  );
}
