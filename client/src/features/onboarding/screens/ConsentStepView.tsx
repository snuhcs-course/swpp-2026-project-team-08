import Feather from '@expo/vector-icons/Feather';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { OnboardingContextValue } from '../hooks/useOnboarding';
import { styles } from './onboardingStyles';

export function ConsentStepView({ model }: { model: OnboardingContextValue }) {
  const { draft } = model;
  const s = copyFor(model.language);
  return (
    <View>
      <View style={[styles.consentPanel, Object.values(draft.consent).some(Boolean) && styles.consentPanelSelected]}>
        <Text style={styles.consentPanelTitle}>{s.onboarding.consentPanelTitle}</Text>
        <Text style={styles.consentPanelSubtitle}>{s.onboarding.consentPanelSubtitle}</Text>
        {(['accountPrivacy', 'photoAnalysis', 'aiTraining'] as const).map((key) => (
          <View key={key} style={[styles.consentCard, draft.consent[key] && styles.selectedConsentCard]}>
            <Pressable
              onPress={() => model.setConsent(key, !draft.consent[key])}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.consent[key] }}
              style={styles.consentRow}
            >
              <View style={[styles.consentCheck, draft.consent[key] && styles.consentChecked]}>
                {draft.consent[key] && <Feather name="check" size={13} color={colors.surface} />}
              </View>
              <View style={styles.consentCopy}>
                <Text style={styles.consentTitle}>
                  {s.onboarding[key]}{' '}
                  <Text style={styles.consentRequired}>
                    {key === 'aiTraining' ? s.onboarding.optional : s.onboarding.required}
                  </Text>
                </Text>
                <Text style={styles.consentDescription}>{s.onboarding.consentDescriptions[key]}</Text>
                <Text style={styles.detail}>{s.onboarding.viewDetail}</Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.safetyBanner}>
        <Feather name="shield" size={15} color={colors.error} />
        <View style={styles.safetyCopy}>
          <Text style={styles.safetyTitle}>{s.onboarding.consentSafetyTitle}</Text>
          <Text style={styles.safetyText}>{s.onboarding.consentNote}</Text>
        </View>
      </View>
    </View>
  );
}
