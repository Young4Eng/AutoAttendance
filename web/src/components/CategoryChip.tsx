import type { Category } from '../types/models';
import { CATEGORY_LABELS } from '../lib/labels';

interface Props {
  category: Category;
  className?: string;
}

/** Text + color status chip per DESIGN.md Status Tints. */
export function CategoryChip({ category, className = '' }: Props) {
  return (
    <span className={`CategoryChip CategoryChip--${category} ${className}`.trim()}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
