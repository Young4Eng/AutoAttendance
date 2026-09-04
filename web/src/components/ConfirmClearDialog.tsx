interface Props {
  open: boolean;
  step: 1 | 2;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Double-confirm before clearing draft attendance for the date. */
export function ConfirmClearDialog({ open, step, count, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-clear-title">
        <h3 id="confirm-clear-title">
          {step === 1 ? '미입력(draft) 지우기' : '한 번 더 확인'}
        </h3>
        <p>
          {step === 1
            ? `이 날짜의 draft ${count}건을 삭제합니다. queued/synced는 남습니다.`
            : '정말 삭제할까요? 되돌릴 수 없습니다.'}
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn danger" onClick={onConfirm}>
            {step === 1 ? '다음' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
