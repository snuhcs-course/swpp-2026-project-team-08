// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

export function createDraftSaveGate() {
  let version = 0;
  let chain: Promise<void> = Promise.resolve();
  let finishing = false;

  return {
    get finishing() {
      return finishing;
    },
    persist(write: () => Promise<void>) {
      const token = ++version;
      chain = chain.catch(() => undefined).then(async () => {
        if (token !== version || finishing) return;
        await write();
      });
      return chain;
    },
    async discard(clear: () => Promise<void>) {
      version += 1;
      finishing = true;
      try {
        await chain.catch(() => undefined);
        await clear();
      } finally {
        finishing = false;
      }
    },
  };
}
