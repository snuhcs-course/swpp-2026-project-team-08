// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import { BottomNavigation, type HomeTab } from '../../../components/BottomNavigation';
import { useHomeNavigation } from '../hooks/useHomeNavigation';
import { useProfile } from '../../../providers/ProfileProvider';

export function HomeNavigationScreen({ selected, onSelect }: { selected: HomeTab; onSelect: (tab: HomeTab) => void }) {
  const { language, profile } = useProfile();
  const homeChild = selected === 'today' ? profile?.id ?? '' : '';
  const compactHome = useHomeNavigation(homeChild);
  return <BottomNavigation compactHome={compactHome} homeAppearance={selected === 'today'} language={language} selected={selected} onSelect={onSelect} />;
}
