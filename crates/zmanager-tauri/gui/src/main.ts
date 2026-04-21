import { createApp } from "vue"
import App from "./App.vue"
import { registerStores } from "@/stores"
import "@/styles/main.css"
const app = createApp(App)
registerStores(app)
app.mount("#app")
