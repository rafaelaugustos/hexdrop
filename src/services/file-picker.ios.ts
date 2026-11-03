import { Application } from '@nativescript/core'
import type { SpellFile } from './files';

@NativeClass()
class PickerDelegate extends NSObject implements UIDocumentPickerDelegate {
  static ObjCProtocols = [UIDocumentPickerDelegate]
  finish!: (file: SpellFile | null) => void
  documentPickerDidPickDocumentsAtURLs(_controller: UIDocumentPickerViewController, urls: NSArray<NSURL>) {
    const url = urls.firstObject
    if (!url) return this.finish(null)
    const access = url.startAccessingSecurityScopedResource()
    try {
      const attributes = NSFileManager.defaultManager.attributesOfItemAtPathError(url.path)
      this.finish({ name: url.lastPathComponent, size: Number(attributes?.objectForKey(NSFileSize) ?? 0), uri: url.absoluteString })
    } catch {
      this.finish({ name: url.lastPathComponent, size: 0, uri: url.absoluteString })
    } finally {
      if (access) url.stopAccessingSecurityScopedResource()
    }
  }
  documentPickerWasCancelled() { this.finish(null) }
}

let active: { picker: UIDocumentPickerViewController; delegate: NSObject } | undefined

export function pickFile(): Promise<SpellFile | null> {
  if (active) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const delegate = PickerDelegate.new() as PickerDelegate
    const picker = UIDocumentPickerViewController.alloc().initWithDocumentTypesInMode(['public.item'], UIDocumentPickerMode.Open)
    delegate.finish = (file) => { active = undefined; resolve(file) }
    picker.delegate = delegate
    picker.allowsMultipleSelection = false
    active = { picker, delegate }
    let presenter = Application.ios.rootController
    while (presenter?.presentedViewController) presenter = presenter.presentedViewController
    if (!presenter) { active = undefined; reject(new Error('Could not open the file picker.')); return }
    presenter.presentViewControllerAnimatedCompletion(picker, true, () => {})
  })
}
