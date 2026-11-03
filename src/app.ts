import { createApp, h, registerElement } from 'nativescript-vue'
import { PotionView } from './potion/potion-view'
import App from './App.vue'
import './app.css'

registerElement('PotionView', () => PotionView)
createApp({ render: () => h('Frame', {}, [h(App)]) }).start()
