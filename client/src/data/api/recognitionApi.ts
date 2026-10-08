import type { FoodItem, MealPhoto } from '../../types/meal';
/** Prototype fixture, never an inference about the supplied photo. Replace with a backend adapter. */
export async function recognizeMealPhoto({ photo, signal }: { photo: MealPhoto; signal: AbortSignal }): Promise<{ photoId: string; foods: FoodItem[] }> {
  if (signal.aborted) throw new Error('Cancelled');
  await new Promise<void>((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); reject(new Error('Cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, 1500);
    signal.addEventListener('abort', cancel, { once: true });
  });
  if (!photo.uri || !photo.mimeType.startsWith('image/')) throw new Error('Invalid photo');
  return { photoId: photo.id, foods: [{ id: `${photo.id}-sample`, name: 'Rolled omelet', ingredients: ['Egg'], preparation: 'Cooked', servingNote: '', history: null, source: 'ai', traits: { texture: ['soft'], tasteType: [], tasteIntensity: [], smell: [], shape: [], visibility: [], temperature: [], color: [] } }] };
}
