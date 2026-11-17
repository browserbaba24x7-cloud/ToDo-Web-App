import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useThemeStore } from "./lib/store/theme-store";
import { AppShell } from "./components/layout/app-shell";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { InboxPage } from "./features/inbox/inbox-page";
import { TodayPage } from "./features/today/today-page";
import { UpcomingPage } from "./features/upcoming/upcoming-page";
import { ProjectsPage } from "./features/projects/projects-page";
import { ProjectDetailsPage } from "./features/projects/project-details-page";
import { SettingsPage } from "./features/settings/settings-page";
import { LoginPage } from "./features/auth/login-page";
import { SignupPage } from "./features/auth/signup-page";
import { ForgotPasswordPage } from "./features/auth/forgot-password-page";
import { ResetPasswordPage } from "./features/auth/reset-password-page";
import { AuthProvider } from "./lib/auth/auth-context";
import { ProtectedRoute } from "./lib/auth/protected-route";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false } },
});

export default function App() {
  const apply = useThemeStore((s) => s.apply);

  useEffect(() => {
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => useThemeStore.getState().apply();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [apply]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="upcoming" element={<UpcomingPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}