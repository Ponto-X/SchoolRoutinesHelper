import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import logoImg from "@/assets/logo-colegio.png";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const ok = login(email.trim(), password);
    setLoading(false);
    if (ok) {
      navigate("/", { replace: true });
    } else {
      setError("E-mail ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImg} alt="Colégio 21 de Abril" width={96} height={96} />
          </div>
          <CardTitle className="text-2xl">Colégio 21 de Abril</CardTitle>
          <p className="text-muted-foreground text-sm">Sistema de Gestão Escolar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-sm font-medium">E-mail</label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">Senha</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium" role="alert">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Acesso demo: diretora@colegio21.com.br / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
