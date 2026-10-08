import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { Image, Platform } from 'react-native';
import type { MealPhoto } from '../../types/meal';
export type PhotoSource = 'camera' | 'gallery' | 'files';
export class PhotoError extends Error {
  constructor(public code: 'permission' | 'image') {
    super(code);
  }
}
const supported = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
];
export async function pickMealPhoto(
  source: PhotoSource,
): Promise<MealPhoto | null> {
  let uri: string;
  let mimeType: string;
  if (source === 'files') {
    const result = await DocumentPicker.getDocumentAsync({
      type: supported,
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    uri = asset.uri;
    mimeType = asset.mimeType ?? '';
  } else {
    if (Platform.OS !== 'web') {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new PhotoError('permission');
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: Platform.OS === 'web',
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: Platform.OS === 'web',
            allowsMultipleSelection: false,
          });
    if (result.canceled) return null;
    const asset = result.assets[0];
    mimeType = asset.mimeType ?? 'image/jpeg';
    uri =
      Platform.OS === 'web' && asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;
  }
  if (!supported.includes(mimeType)) throw new PhotoError('image');
  try {
    await new Promise<void>((resolve, reject) => {
      Image.getSize(uri, () => resolve(), reject);
    });
  } catch {
    throw new PhotoError('image');
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (Platform.OS !== 'web') {
    const directory = new Directory(Paths.document, 'meal-photos');
    directory.create({ idempotent: true, intermediates: true });
    const target = new File(directory, `${id}.${mimeType.split('/')[1]}`);
    new File(uri).copy(target);
    uri = target.uri;
  }
  return { id, uri, mimeType };
}
