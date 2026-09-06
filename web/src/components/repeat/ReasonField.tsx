import type { Category } from '../../types/models';
import { REASON_PRESETS } from '../../lib/reasonPresets';

const MAX = 50;

interface Props {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  category?: Category;
}

export function ReasonField({ value, onChange, required, category }: Props) {
  const len = value.length;
  const chips = category ? REASON_PRESETS[category] : [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
            4
          </span>
          <h2 className="text-lg font-semibold text-on-surface m-0">
            사유 입력{required ? ' (필수)' : ''}
          </h2>
        </div>
        <span className="text-[11px] font-medium text-outline">생기부 및 NEIS 반영 문구</span>
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {chips.map((r) => (
            <button
              key={r}
              type="button"
              className="px-2 py-0.5 rounded bg-surface-container-low border border-[#E4E4E7] text-[12px] hover:bg-teal-50"
              onClick={() => onChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      ) : category === 'other' ? (
        <p className="text-[12px] text-outline m-0">기타는 사유를 직접 입력합니다.</p>
      ) : null}
      <div>
        <textarea
          className="w-full bg-surface-container-low rounded-lg p-4 text-on-surface text-[13px] focus:outline-none placeholder:text-outline resize-none"
          placeholder="구체적인 사유를 입력하세요..."
          rows={2}
          maxLength={MAX}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          aria-label="사유"
        />
        <div className="flex items-center justify-between mt-1 px-0.5">
          <span className="text-[11px] font-medium text-outline">
            {required ? '기타 구분은 사유가 필수입니다' : '선택 입력'}
          </span>
          <span className="text-[11px] font-medium text-outline">
            {len} / {MAX}자
          </span>
        </div>
      </div>
    </div>
  );
}
