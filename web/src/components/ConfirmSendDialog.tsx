interface Props {
  open: boolean;
  step: 1 | 2;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Double-confirm before marking drafts as queued. */
export function ConfirmSendDialog({ open, step, count, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-send-title">
        <h3 id="confirm-send-title">
          {step === 1 ? '전송 대기열에 넣기' : '한 번 더 확인'}
        </h3>
        <p>
          {step === 1
            ? `${count}건을 대기(queued)로 표시합니다. 출석 행은 포함되지 않습니다.`
            : '정말 대기열에 넣을까요? 이 상태는 확장 전송 준비입니다.'}
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn secondary" onClick={onConfirm}>
            {step === 1 ? '다음' : '대기열에 넣기'}
          </button>
        </div>
      </div>
    </div>
  );
}
