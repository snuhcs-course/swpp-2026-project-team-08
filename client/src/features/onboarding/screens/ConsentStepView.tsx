// This Code is generated with AI
// AI-generated with GPT-6, 2026-11-12, reviewed by Seoyeon Heo
// Changed: 동의 세부보기 링크를 체크박스와 분리

import Feather from '@expo/vector-icons/Feather';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { ExternalLink } from '../../../components/ExternalLink';
import { PRIVACY_POLICY_URL } from '../../../util/links';
import { copyFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';
import type { OnboardingDraft } from '../types';
import { styles } from './onboardingStyles';

export function ConsentStepView({ consent, language, onToggle }: {
  consent: OnboardingDraft['consent'];
  language: Language;
  onToggle: (key: keyof OnboardingDraft['consent']) => void;
}) {
  const s = copyFor(language);
  return (
    <View>
      <View style={[styles.consentPanel, Object.values(consent).some(Boolean) && styles.consentPanelSelected]}>
        <Text style={styles.consentPanelTitle}>{s.onboarding.consentPanelTitle}</Text>
        <Text style={styles.consentPanelSubtitle}>{s.onboarding.consentPanelSubtitle}</Text>
        {(['accountPrivacy', 'photoAnalysis', 'aiTraining'] as const).map((key) => (
          <View key={key} style={[styles.consentCard, consent[key] && styles.selectedConsentCard]}>
            <Pressable
              onPress={() => onToggle(key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent[key] }}
              style={styles.consentPressable}
            >
              <View style={styles.consentRow}>
                <View style={[styles.consentCheck, consent[key] && styles.consentChecked]}>
                  {consent[key] && <Feather name="check" size={13} color={colors.surface} />}
                </View>
                <Text style={styles.consentTitle}>{s.onboarding[key]}</Text>
                <View style={[styles.consentBadge, key === 'aiTraining' && styles.consentOptionalBadge]}>
                  <Text style={[styles.consentRequired, key === 'aiTraining' && styles.consentOptional]}>
                    {key === 'aiTraining' ? s.onboarding.optional : s.onboarding.required}
                  </Text>
                </View>
              </View>
              <View style={styles.consentCopy}>
                <Text style={styles.consentDescription}>{s.onboarding.consentDescriptions[key]}</Text>
              </View>
            </Pressable>
            <ExternalLink href={PRIVACY_POLICY_URL} errorMessage={s.common.openLinkFailed}>
              <Text style={styles.detail}>{s.onboarding.viewDetail}</Text>
            </ExternalLink>
          </View>
        ))}
      </View>
      <View style={styles.safetyBanner}>
        <UiAssetIcon name="onboarding-shield" />
        <View style={styles.safetyCopy}>
          <Text style={styles.safetyTitle}>{s.onboarding.consentSafetyTitle}</Text>
          <Text style={styles.safetyText}>{s.onboarding.consentNote}</Text>
        </View>
      </View>
    </View>
  );
}
