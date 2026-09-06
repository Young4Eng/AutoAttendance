const MAX = 50;

interface Props {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

/** Step 4 — reason textarea with char count; placeholder only (no stitch mock copy). */
export function ReasonField({ value, onChange, required }: Props) {
  const len = value.length;
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
