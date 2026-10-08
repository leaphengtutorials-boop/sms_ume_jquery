import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: () => import("@/views/DashboardView.vue"),
    meta: { title: "ផ្ទាំងគ្រប់គ្រង", icon: "📊" },
  },
  {
    path: "/subjects",
    name: "subjects",
    component: () => import("@/views/SubjectsView.vue"),
    meta: { title: "មុខវិជ្ជា", icon: "📚" },
  },
  {
    path: "/students",
    name: "students",
    component: () => import("@/views/StudentsView.vue"),
    meta: { title: "សិស្ស", icon: "👥" },
  },
  {
    path: "/enrollment",
    name: "enrollment",
    component: () => import("@/views/EnrollmentView.vue"),
    meta: { title: "ចុះឈ្មោះចូលរៀន", icon: "📝" },
  },
  {
    path: "/attendance",
    name: "attendance",
    component: () => import("@/views/AttendanceView.vue"),
    meta: { title: "វត្តមាន", icon: "✅" },
  },
  {
    path: "/homework",
    name: "homework",
    component: () => import("@/views/HomeworkView.vue"),
    meta: { title: "កិច្ចការ", icon: "📋" },
  },
  {
    path: "/scores-midterm",
    name: "midterm",
    component: () => import("@/views/ScoresMidtermView.vue"),
    meta: { title: "ពិន្ទុ Midterm", icon: "📝" },
  },
  {
    path: "/scores-final",
    name: "final",
    component: () => import("@/views/ScoresFinalView.vue"),
    meta: { title: "ពិន្ទុ Final", icon: "🎓" },
  },
  {
    path: "/reports",
    name: "reports",
    component: () => import("@/views/ReportsView.vue"),
    meta: { title: "លទ្ធផល", icon: "📈" },
  },
  {
    path: "/completed",
    name: "completed",
    component: () => import("@/views/CompletedView.vue"),
    meta: { title: "សិស្សបញ្ចប់", icon: "🎓" },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/SettingsView.vue"),
    meta: { title: "ការកំណត់", icon: "⚙️" },
  },

  // ✅ Redirect Route មិនស្គាល់ → Dashboard
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory("/sms_ume/"), // ✅ ដក # ចេញ
  routes,
});

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || ""} — UME`;
  next();
});

export default router;
