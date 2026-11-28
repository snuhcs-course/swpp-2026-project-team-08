// AI-generated with GPT-6, 2026-11-24, reviewed by Seoyeon Heo
// Changed: 식사 초안 삭제 메뉴와 즉시 닫기
import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fonts } from '../util/fonts';
import type { Language } from '../types/profile';
import { colors } from '../util/colors';
import { copyFor } from '../util/strings';

type MenuPosition = { top: number; right: number };
type MenuStage = 'menu' | 'confirm' | null;

export function DraftMenu({ language, onDelete, onOpen }: {
  language: Language; onDelete: () => void; onOpen?: (position: MenuPosition) => void;
}) {
  const [stage, setStage] = useState<MenuStage>(null);
  const [position, setPosition] = useState({ top: 0, right: 16 });
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const { width } = useWindowDimensions();
  const copy = copyFor(language);
  const s = copy.mealCheckin;
  const open = () => {
    anchor.current?.measureInWindow((x, y, w, h) => {
      const nextPosition = { top: y + h, right: Math.max(16, width - x - w) };
      if (onOpen) onOpen(nextPosition);
      else { setPosition(nextPosition); setStage('menu'); }
    });
  };
  return <View ref={anchor} collapsable={false} style={styles.anchor}>
    <Pressable accessibilityRole="button" accessibilityLabel={s.draftMenu} onPress={open} hitSlop={10}>
      <Feather name="more-vertical" size={18} color={colors.homeText} />
    </Pressable>
    {!onOpen && <DraftMenuOverlay language={language} onDelete={onDelete} stage={stage} setStage={setStage} position={position} />}
  </View>;
}
export function DraftMenuOverlay({ language, onDelete, stage, setStage, position }: {
  language: Language; onDelete: () => void; stage: MenuStage;
  setStage: (stage: MenuStage) => void; position: MenuPosition;
}) {
  const copy = copyFor(language);
  const s = copy.mealCheckin;
  return <Modal transparent animationType="none" visible={stage !== null} onRequestClose={() => setStage(null)}>
    {stage === 'menu' ? <Pressable style={styles.menuScrim} onPress={() => setStage(null)}>
      <Pressable accessibilityRole="button" accessibilityLabel={s.deleteDraft}
        style={[styles.menu, position]} onPress={() => setStage('confirm')}>
        <Feather name="trash-2" size={14} color={colors.error} />
        <Text style={styles.menuDanger}>{s.deleteDraft}</Text>
      </Pressable>
    </Pressable> : stage === 'confirm' ? <View style={styles.dialogScrim}>
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>{s.deleteDraftConfirm}</Text>
        <Text style={styles.confirmBody}>{s.deleteDraftBody}</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.cancelButton} onPress={() => setStage(null)}>
            <Text style={styles.cancelLabel}>{s.cancel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.deleteButton} onPress={() => { setStage(null); onDelete(); }}>
            <Text style={styles.deleteLabel}>{copy.mealLog.delete}</Text>
          </Pressable>
        </View>
      </View>
    </View> : null}
  </Modal>;
}
export function DraftToast({ language, visible, error, onUndo }: {
  language: Language; visible: boolean; error: 'delete' | 'undo' | null; onUndo: () => void;
}) {
  const s = copyFor(language).mealCheckin;
  if (!visible && !error) return null;
  return <View accessibilityLiveRegion="polite" style={styles.toast}>
    <Text style={styles.text}>{error === 'delete' ? s.draftDeleteFailed : error === 'undo' ? s.draftUndoFailed : s.draftDeleted}</Text>
    {visible && <Pressable accessibilityRole="button" onPress={onUndo}><Text style={styles.action}>{s.draftUndo}</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  anchor: { alignSelf: 'flex-end' },
  menuScrim: { flex: 1 },
  menu: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, shadowColor: colors.navy, shadowOpacity: 0.16, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 6 },
  menuDanger: { color: colors.error, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  dialogScrim: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  confirmCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 10 },
  confirmTitle: { color: colors.homeText, fontSize: 18, fontFamily: fonts.poppinsSemiBold },
  confirmBody: { color: colors.homeMuted, fontSize: 13, fontFamily: fonts.poppinsRegular, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  deleteButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { color: colors.surface, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  toast: { backgroundColor: colors.surface, borderColor: colors.homeBorder, borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  text: { color: colors.homeText }, action: { color: colors.homePrimary },
});
