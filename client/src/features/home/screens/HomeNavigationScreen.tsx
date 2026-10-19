// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; share the same navigation on Home and other tabs
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import { BottomNavigation, type HomeTab } from '../../../components/BottomNavigation';
import { useProfile } from '../../../providers/ProfileProvider';

export function HomeNavigationScreen({ selected, onSelect }: { selected: HomeTab; onSelect: (tab: HomeTab) => void }) {
  const { language } = useProfile();
  return <BottomNavigation language={language} selected={selected} onSelect={onSelect} />;
}
