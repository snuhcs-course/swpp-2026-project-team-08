import { createContext, useContext } from 'react';

export const FontReadyContext = createContext(false);

export function useFontReady() {
  return useContext(FontReadyContext);
}
