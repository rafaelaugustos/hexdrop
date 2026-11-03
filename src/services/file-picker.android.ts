import { AndroidApplication, Application, type AndroidActivityResultEventData } from '@nativescript/core'
import type { SpellFile } from './files'

const REQUEST = 7041
let pending = false
export function pickFile(): Promise<SpellFile | null> {
  if (pending) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const activity = Application.android.foregroundActivity ?? Application.android.startActivity
    if (!activity) { reject(new Error('Could not open the file picker.')); return }
    const done = (file: SpellFile | null) => {
      pending = false
      Application.android.off(AndroidApplication.activityResultEvent, onResult)
      resolve(file)
    }
    const onResult = (event: AndroidActivityResultEventData) => {
      if (event.requestCode !== REQUEST) return
      if (event.resultCode !== android.app.Activity.RESULT_OK || !event.intent?.getData()) { done(null); return }
      const uri = event.intent.getData()
      if (!uri) { done(null); return }
      let cursor: android.database.Cursor | null = null
      try {
        cursor = activity.getContentResolver().query(uri, null, null, null, null)
        let name = uri.getLastPathSegment() ?? 'file'
        let size = 0
        if (cursor?.moveToFirst()) {
          const nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
          const sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE)
          if (nameIndex >= 0) name = cursor.getString(nameIndex)
          if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) size = Number(cursor.getLong(sizeIndex))
        }
        done({ name, size, uri: uri.toString() })
      } catch (error) {
        pending = false
        Application.android.off(AndroidApplication.activityResultEvent, onResult)
        reject(error)
      } finally { cursor?.close() }
    }
    pending = true
    Application.android.on(AndroidApplication.activityResultEvent, onResult)
    try {
      const intent = new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT)
      intent.addCategory(android.content.Intent.CATEGORY_OPENABLE)
      intent.setType('*/*')
      intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
      activity.startActivityForResult(intent, REQUEST)
    } catch (error) {
      pending = false
      Application.android.off(AndroidApplication.activityResultEvent, onResult)
      reject(error)
    }
  })
}
