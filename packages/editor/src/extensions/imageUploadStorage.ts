import { Extension } from '@tiptap/core';

export interface ImageUploadStorage {
  onImageUpload: ((file: File) => Promise<string>) | null;
  triggerUploadModal: (() => void) | null;
}

export const ImageUploadStorage = Extension.create<object, ImageUploadStorage>({
  name: 'imageUploadStorage',

  addStorage() {
    return {
      onImageUpload: null,
      triggerUploadModal: null,
    };
  },
});
