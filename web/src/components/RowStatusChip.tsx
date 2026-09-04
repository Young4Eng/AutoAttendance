import type { RecordStatus } from '../types/models';
import { STATUS_LABELS } from '../lib/labels';

interface Props {
  /** null/undefined = present (미입력 display for no record) */
  status: RecordStatus | null | undefined;
  present?: boolean;
}

export function RowStatusChip({ status, present }: Props) {
  if (present || !status) {
    return <span className="RowStatusChip present">출석</span>;
  }
  return (
    <span className={`RowStatusChip status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
