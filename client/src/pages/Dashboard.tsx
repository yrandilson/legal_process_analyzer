import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  FileText,
  TrendingUp,
  Loader2,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const { data: processes = [], isLoading: processesLoading } = trpc.processes.list.useQuery();
  const { data: allDeadlines = [], isLoading: deadlinesLoading } = trpc.deadlines.listMine.useQuery();
  const { data: documents = [], isLoading: documentsLoading } = trpc.documents.listMine.useQuery();
  const exportCalendar = trpc.deadlines.exportIcs.useMutation();

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getUrgencyIcon = (urgency: string | null) => {
    switch (urgency) {
      case "critical":
        return <AlertCircle className="w-4 h-4" />;
      case "high":
        return <Clock className="w-4 h-4" />;
      case "medium":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const filteredDeadlines = allDeadlines.filter((deadline) => {
    const matchesSearch =
      searchTerm === "" ||
      deadline.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deadline.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUrgency = urgencyFilter === "all" || deadline.urgency === urgencyFilter;

    return matchesSearch && matchesUrgency;
  });

  const stats = {
    total: processes.length,
    critical: allDeadlines.filter((d) => d.urgency === "critical").length,
    nextWeek: allDeadlines.filter((d) => ["high", "medium"].includes(d.urgency ?? "")).length,
    processed: documents.filter((doc) => doc.status === "processed").length,
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  };

  const chartData = useMemo(() => {
    const base = [
      { name: "Seg", prazos: 0 },
      { name: "Ter", prazos: 0 },
      { name: "Qua", prazos: 0 },
      { name: "Qui", prazos: 0 },
      { name: "Sex", prazos: 0 },
      { name: "Sab", prazos: 0 },
      { name: "Dom", prazos: 0 },
    ];

    for (const deadline of allDeadlines) {
      const date = new Date(deadline.calculatedDate);
      const dayIndex = (date.getDay() + 6) % 7;
      base[dayIndex].prazos += 1;
    }

    return base;
  }, [allDeadlines]);

  const handleExportCalendar = async () => {
    try {
      const result = await exportCalendar.mutateAsync();
      const blob = new Blob([result.content], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Agenda exportada com ${result.count} prazo(s).`);
    } catch (error) {
      console.error("Falha ao exportar agenda:", error);
      toast.error("Não foi possível exportar a agenda.");
    }
  };

  if (processesLoading || deadlinesLoading || documentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Gerencie seus processos e prazos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCalendar}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Agenda
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/upload")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Processos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-2">Sob monitoramento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-slate-500 mt-2">Vencendo hoje/amanhã</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-600">Próximos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.nextWeek}</div>
            <p className="text-xs text-slate-500 mt-2">Prazos urgentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.processed}</div>
            <p className="text-xs text-slate-500 mt-2">Processados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Prazos por Dia da Semana</CardTitle>
          <CardDescription>Distribuição de prazos ao longo da semana</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="prazos"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Processos */}
      <Card>
        <CardHeader>
          <CardTitle>Processos Ativos</CardTitle>
          <CardDescription>Lista de todos os seus processos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {processes.length > 0 ? (
              processes.map((process) => (
                <div
                  key={process.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/processo/${process.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <h3 className="font-semibold text-slate-900">{process.processNumber}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{process.clientName}</p>
                      {process.subject && (
                        <p className="text-xs text-slate-500 mt-1">{process.subject}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={process.status === "active" ? "default" : "secondary"}
                      >
                        {process.status === "active"
                          ? "Ativo"
                          : process.status === "archived"
                            ? "Arquivado"
                            : "Concluído"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum processo cadastrado</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLocation("/upload")}
                >
                  Criar Primeiro Processo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prazos */}
      <Card>
        <CardHeader>
          <CardTitle>Prazos Processuais</CardTitle>
          <CardDescription>Lista de todos os prazos com alertas por urgência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por tipo de prazo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Prazos */}
          <div className="space-y-3">
            {filteredDeadlines.length > 0 ? (
              filteredDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded ${getUrgencyColor(deadline.urgency)}`}>
                          {getUrgencyIcon(deadline.urgency)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{deadline.type}</h3>
                          <p className="text-sm text-slate-600">{deadline.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        {formatDate(deadline.calculatedDate)}
                      </div>
                      <p className="text-xs text-slate-500">
                        {deadline.businessDaysCount} dias úteis
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="outline" className={getUrgencyColor(deadline.urgency)}>
                      {deadline.urgency === "critical"
                        ? "Crítico"
                        : deadline.urgency === "high"
                          ? "Alto"
                          : deadline.urgency === "medium"
                            ? "Médio"
                            : "Baixo"}
                    </Badge>
                    <Badge variant="outline">{deadline.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum prazo encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
