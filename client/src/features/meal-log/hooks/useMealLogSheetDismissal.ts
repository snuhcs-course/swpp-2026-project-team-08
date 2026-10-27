// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Wait for native sheet dismissal before releasing queued navigation

import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { Platform } from 'react-native';
import type { MealLogSheetHandle } from '../components/MealLogSheetLayout';

type Phase = 'hidden' | 'presenting' | 'shown' | 'closing';

export function useMealLogSheetDismissal(requested: boolean, ref?: Ref<MealLogSheetHandle>) {
  const [closing, setClosing] = useState(false);
  const phase = useRef<Phase>('hidden');
  const appeared = useRef(false);
  const completion = useRef<(() => void) | null>(null);
  const visible = requested && !closing;

  if (!requested && closing) setClosing(false);

  useLayoutEffect(() => {
    if (visible && phase.current !== 'presenting' && phase.current !== 'shown') {
      phase.current = 'presenting';
      appeared.current = false;
    } else if (!visible && phase.current !== 'hidden') {
      phase.current = 'closing';
    }
  }, [visible]);

  useLayoutEffect(() => () => { completion.current = null; }, []);

  useImperativeHandle(ref, () => ({
    dismiss(onDismissed) {
      if (completion.current) return;
      if (phase.current === 'hidden') {
        onDismissed();
        return;
      }
      completion.current = onDismissed;
      // A presentation already in progress must finish before its dismissal can begin.
      if (phase.current === 'shown') {
        phase.current = 'closing';
        setClosing(true);
      }
    },
  }), []);

  function finishDismissal() {
    phase.current = 'hidden';
    appeared.current = false;
    const onDismissed = completion.current;
    completion.current = null;
    onDismissed?.();
  }

  function finishPresentation() {
    phase.current = 'shown';
    if (completion.current) {
      phase.current = 'closing';
      setClosing(true);
    }
  }

  return {
    visible,
    onAppear() {
      appeared.current = true;
      // Android posts its appear event after the stack's transition-complete event.
      if (Platform.OS === 'android' && phase.current === 'presenting') finishPresentation();
    },
    onFinishTransitioning() {
      if (phase.current === 'presenting' && appeared.current) {
        finishPresentation();
      } else if (phase.current === 'closing') {
        finishDismissal();
      }
    },
    onNativeDismissed() {
      if (phase.current === 'closing') return false;
      const userDismissed = requested
        && (phase.current === 'presenting' || phase.current === 'shown');
      finishDismissal();
      return userDismissed;
    },
  };
}
