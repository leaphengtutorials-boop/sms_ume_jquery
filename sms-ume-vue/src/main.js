import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// ✅ Reuse CSS ពី jQuery
import './assets/css/main.css'
import './assets/css/components.css'
import './assets/css/sidebar.css'
import './assets/css/tables.css'
import './assets/css/students.css'
import './assets/css/subjects.css'
import './assets/css/enrollment.css'
import './assets/css/attendance.css'
import './assets/css/homework.css'
import './assets/css/reports.css'
import './assets/css/responsive.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')