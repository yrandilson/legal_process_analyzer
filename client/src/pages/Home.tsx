import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, AlertCircle, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Sentinela de Prazos</span>
          </div>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Entrar
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Nunca Mais Perca um Prazo Processual
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Plataforma inteligente que monitora publicações de tribunais, resume andamentos e
            gerencia prazos automaticamente com precisão forense.
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
          >
            Começar Gratuitamente
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <FileText className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle className="text-white">Upload de PDFs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Envie publicações do Diário Oficial e intimações judiciais
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <CardTitle className="text-white">Extração Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                IA extrai automaticamente prazos, partes e informações processuais
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <Calendar className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle className="text-white">Cálculo de Dias Úteis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Cálculo preciso considerando feriados forenses e suspensões
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle className="text-white">Dashboard em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Visualize todos os prazos com alertas por urgência
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 bg-slate-800/50 border border-slate-700 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Por que usar Sentinela de Prazos?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">0</div>
              <p className="text-white font-semibold">Prazos Perdidos</p>
              <p className="text-slate-400 text-sm mt-2">
                Notificações automáticas 3 dias, 1 dia e no dia do vencimento
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-500 mb-2">3x</div>
              <p className="text-white font-semibold">Mais Processos</p>
              <p className="text-slate-400 text-sm mt-2">
                Gerencie muito mais casos com automação inteligente
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-500 mb-2">100%</div>
              <p className="text-white font-semibold">Seguro</p>
              <p className="text-slate-400 text-sm mt-2">
                Documentos criptografados e em conformidade com LGPD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-400">
          <p>&copy; 2026 Sentinela de Prazos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
