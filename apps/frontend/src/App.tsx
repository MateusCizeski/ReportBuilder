import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WorkspacesPage } from "./pages/WorkspacesPage";
import { DatasourcesPage } from "./pages/DatasourcesPage";
import { ChatPage } from "./pages/ChatPage";
import { ContextPage } from "./pages/ContextPage";
import { ReportsPage } from "./pages/ReportsPage";
import { DashboardsPage } from "./pages/DashboardsPage";
import { DashboardPage } from "./pages/DashboardPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<WorkspacesPage />} />
            <Route
              path="/workspaces/:workspaceId/datasources"
              element={<DatasourcesPage />}
            />
            <Route
              path="/workspaces/:workspaceId/chat/:datasourceId"
              element={<ChatPage />}
            />
            <Route
              path="/workspaces/:workspaceId/context/:datasourceId"
              element={<ContextPage />}
            />
            <Route
              path="/workspaces/:workspaceId/reports"
              element={<ReportsPage />}
            />
            <Route
              path="/workspaces/:workspaceId/dashboards"
              element={<DashboardsPage />}
            />
            <Route
              path="/workspaces/:workspaceId/dashboards/:dashboardId"
              element={<DashboardPage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
