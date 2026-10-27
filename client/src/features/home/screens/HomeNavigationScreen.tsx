// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { BottomNavigation, type HomeTab } from '../../../components/BottomNavigation';
import { useProfile } from '../../../providers/ProfileProvider';

export function HomeNavigationScreen({ selected, onSelect }: { selected: HomeTab; onSelect: (tab: HomeTab) => void }) {
  const { language } = useProfile();
  return <BottomNavigation language={language} selected={selected} onSelect={onSelect} />;
}
