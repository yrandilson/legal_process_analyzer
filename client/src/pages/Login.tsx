import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devName, setDevName] = useState("Advogado Local");
  const [devEmail, setDevEmail] = useState("local@sentinela.dev");
  const devLogin = trpc.auth.devLogin.useMutation();
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    if (!isDevelopment) return;

    const storedName = localStorage.getItem("devLoginName");
    const storedEmail = localStorage.getItem("devLoginEmail");

    if (storedName) {
      setDevName(storedName);
    }

    if (storedEmail) {
      setDevEmail(storedEmail);
    }
  }, [isDevelopment]);

  useEffect(() => {
    if (!isDevelopment) return;
    localStorage.setItem("devLoginName", devName);
  }, [devName, isDevelopment]);

  useEffect(() => {
    if (!isDevelopment) return;
    localStorage.setItem("devLoginEmail", devEmail);
  }, [devEmail, isDevelopment]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      window.location.href = getLoginUrl();
    } catch (err) {
      setError("Falha ao iniciar login OAuth. Verifique a configuração do ambiente.");
      setLoading(false);
    }
  };

  const handleLocalLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await devLogin.mutateAsync({
        name: devName.trim() || "Advogado Local",
        email: devEmail.trim() || "local@sentinela.dev",
      });
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Falha no login local. Confira se o backend está em modo de desenvolvimento.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
          <CardTitle className="text-white text-2xl">Sentinela de Prazos</CardTitle>
          <CardDescription className="text-slate-400">
            Faça login para acessar o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Redirecionando..." : "Entrar com OAuth"}
            </Button>

            {isDevelopment && (
              <div className="space-y-3 rounded-md border border-slate-700 bg-slate-900/30 p-3">
                <p className="text-sm font-medium text-slate-300">Perfil Local (Dev)</p>

                <div className="space-y-2">
                  <Label htmlFor="dev-name" className="text-slate-300">
                    Nome
                  </Label>
                  <Input
                    id="dev-name"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    placeholder="Nome para sessão local"
                    disabled={loading || devLogin.isPending}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dev-email" className="text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="dev-email"
                    type="email"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    placeholder="email@dev.local"
                    disabled={loading || devLogin.isPending}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocalLogin}
                  disabled={loading || devLogin.isPending}
                  className="w-full"
                >
                  {devLogin.isPending ? "Entrando localmente..." : "Entrar Local (Dev)"}
                </Button>
              </div>
            )}

            <div className="text-center text-slate-400 text-sm mt-4 p-3 bg-slate-700/50 rounded">
              <p className="font-semibold mb-2">Autenticação Segura:</p>
              <p>Você será redirecionado para o portal OAuth</p>
              <p>Após login, retorna automaticamente ao dashboard</p>
              {isDevelopment && <p className="mt-2">Modo dev: login local disponível.</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
