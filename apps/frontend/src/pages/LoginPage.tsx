import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/auth.store";

const DEMO = { email: "demo@reportbuilder.dev", password: "demo1234" };

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get("/auth/me");
      setUser(me.data);
      navigate("/datasources");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setForm(DEMO);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight">ReportBuilder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Entre na sua conta
          </p>
        </div>

        <div className="bg-background border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="seu@email.com"
                required
                className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
                required
                className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Conta de demonstração
            </p>
            <button
              onClick={fillDemo}
              className="w-full py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              demo@reportbuilder.dev / demo1234
            </button>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Não tem conta?{" "}
            <Link
              to="/register"
              className="text-foreground underline underline-offset-2"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
