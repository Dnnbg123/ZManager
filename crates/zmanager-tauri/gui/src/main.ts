/**
 * ZManager GUI - Main Entry Point
 *
 * Vue 3 + TypeScript + Pinia + PrimeVue + TailwindCSS
 * High-performance file manager with multi-split view
 */

import { createApp } from "vue"
import { createPinia } from "pinia"
import PrimeVue from "primevue/config"
import Aura from "@primevue/themes/aura"
import App from "./App.vue"
import "./index.css"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: ".dark-mode",
      cssLayer: false,
    },
  },
})

app.mount("#app")
