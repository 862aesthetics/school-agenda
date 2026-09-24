import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './ui/primitives';
import type { AvatarShape } from '../types/database';
import { useAuthStore } from '../store/authStore';

export function AvatarUploader({
  url,
  shape,
  name,
  onUploaded,
}: {
  url: string | null;
  shape: AvatarShape;
  name?: string | null;
  onUploaded: (url: string) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be under 5MB.');
      return;
    }
    setError(null);
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    setUploading(false);
    if (uploadError) {
      setError('Upload failed. Please try again.');
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    onUploaded(`${data.publicUrl}?t=${Date.now()}`);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar url={url} name={name} shape={shape} size={64} />
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-slate/30 px-3.5 py-2 text-sm font-medium text-teal hover:border-teal disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : url ? 'Change photo' : 'Upload photo'}
        </button>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
