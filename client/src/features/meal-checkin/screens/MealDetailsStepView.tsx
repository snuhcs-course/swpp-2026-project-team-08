import { Text, View } from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { DateField } from '../../../components/DateField';
import { SelectionChoice } from '../../../components/SelectionChoice';
import { formStyles as ui } from '../../../components/formStyles';
import { mealSettings, mealTypes } from '../../../types/meal';
import { localDate } from '../../../util/date';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

export function MealDetailsStepView({ p }: { p: MealCheckinViewProps }) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const [year, month, day] = d.mealDate.split('-').map(Number);
  const today = localDate() === d.mealDate;
  const dateLabel = m.dateLabel(
    new Date(year, month - 1, day).toLocaleDateString(p.language === 'ko' ? 'ko-KR' : 'en-GB', {
      month: 'long',
      day: 'numeric',
      ...(!today ? { year: 'numeric' } : {}),
    }),
    today,
  );
  return (
    <>
      <Text style={ui.title}>{m.settingTitle}</Text>
      <DateField
        label={dateLabel}
        labels={{ date: m.date, year: m.year, month: m.month, day: m.day, confirm: m.confirmDate, close: s.common.close }}
        {...p.dateInput}
      />
      <Text style={ui.label}>{m.mealType}</Text>
      <View style={ui.grid}>
        {mealTypes.map((value) => (
          <SelectionChoice
            key={value}
            label={m.types[value]}
            tile
            icon={<AppIcon name={value} size={21} />}
            selected={d.mealType === value}
            onPress={() => p.onUpdate({ mealType: value })}
          />
        ))}
      </View>
      <Text style={[ui.label, { fontSize: 14 }]}>{m.setting}</Text>
      <View style={ui.grid}>
        {mealSettings.map((value) => (
          <SelectionChoice
            key={value}
            label={m.settings[value]}
            tile
            icon={<AppIcon name={value} size={21} />}
            selected={d.setting === value}
            onPress={() => p.onUpdate({ setting: value })}
          />
        ))}
      </View>
    </>
  );
}
