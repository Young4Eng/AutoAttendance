import { Shell, type AppScreen } from "./Shell";
import { StitchMain } from "./StitchMain";
type Props = { teacherLabel: string; screen: AppScreen; onNav: (s: AppScreen) => void; onLogout: () => void };
export function QaScreen(p: Props) {
  return (
    <Shell {...p}>
      <StitchMain folder="q_a" />
    </Shell>
  );
}
