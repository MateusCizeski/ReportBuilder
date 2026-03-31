import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DatasourcesPage } from "./pages/DatasourcesPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ChatPage } from "./pages/ChatPage";
import { ContextPage } from "./pages/ContextPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<WorkspacePage />} />
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
              path="/workspace/:datasourceId"
              element={<WorkspacePage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
