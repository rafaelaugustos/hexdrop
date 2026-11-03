export interface SpellFile { name: string; size: number; uri?: string }
export const MAX_FILE_BYTES = 200 * 1024 * 1024
export const EXAMPLE_FILE: SpellFile = { name: 'spells.zip', size: Math.round(48.2 * 1024 * 1024) }

export function fileError(file: SpellFile): string | null {
  if (!file.name.trim()) return 'This file does not have a valid name.'
  if (!Number.isFinite(file.size) || file.size < 0) return 'Could not verify the file size.'
  if (file.size > MAX_FILE_BYTES) return 'The vial holds files up to 200 MB.'
  return null
}
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
