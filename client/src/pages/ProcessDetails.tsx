import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Building2,
  Gavel,
  Clock,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProcessDetailsPageProps {
  processId: number;
}

export default function ProcessDetailsPage({ processId }: ProcessDetailsPageProps) {
  const [, setLocation] = useLocation();
  const { data: process, isLoading: processLoading } = trpc.processes.getById.useQuery({
    id: processId,
  });
  const { data: deadlines = [] } = trpc.deadlines.listByProcess.useQuery({
    processId,
  });
  const { data: documents = [] } = trpc.documents.listByProcess.useQuery({
    processId,
  });

  if (processLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg text-slate-600">Processo não encontrado</p>
        </div>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">{process.processNumber}</h1>
            <p className="text-slate-600 mt-1">Cliente: {process.clientName}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="w-4 h-4" />
                Autor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{process.plaintiff || "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="w-4 h-4" />
                Réu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{process.defendant || "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Tribunal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{process.court || "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                Juiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{process.judge || "—"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prazos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prazos">Prazos ({deadlines.length})</TabsTrigger>
            <TabsTrigger value="documentos">Documentos ({documents.length})</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          </TabsList>

          {/* Prazos */}
          <TabsContent value="prazos">
            <Card>
              <CardHeader>
                <CardTitle>Prazos Processuais</CardTitle>
                <CardDescription>Lista de todos os prazos associados a este processo</CardDescription>
              </CardHeader>
              <CardContent>
                {deadlines.length > 0 ? (
                  <div className="space-y-3">
                    {deadlines.map((deadline) => (
                      <div
                        key={deadline.id}
                        className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <h3 className="font-semibold text-slate-900">{deadline.type}</h3>
                            </div>
                            <p className="text-sm text-slate-600">{deadline.description}</p>
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
                          <Badge className={getUrgencyColor(deadline.urgency)}>
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum prazo registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Processados</CardTitle>
                <CardDescription>PDFs e publicações analisadas</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <h3 className="font-semibold text-slate-900">{doc.fileName}</h3>
                            </div>
                            {doc.summary && (
                              <p className="text-sm text-slate-600 line-clamp-2">{doc.summary}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (doc.fileUrl) window.open(doc.fileUrl, "_blank");
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Badge variant="outline">{doc.status}</Badge>
                          <span className="text-xs text-slate-500">
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento processado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detalhes */}
          <TabsContent value="detalhes">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Assunto</label>
                  <p className="text-slate-900 mt-1">{process.subject || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <p className="text-slate-900 mt-1">
                    <Badge
                      variant={process.status === "active" ? "default" : "secondary"}
                    >
                      {process.status === "active"
                        ? "Ativo"
                        : process.status === "archived"
                          ? "Arquivado"
                          : "Concluído"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Criado em</label>
                  <p className="text-slate-900 mt-1">{formatDate(process.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Última atualização</label>
                  <p className="text-slate-900 mt-1">{formatDate(process.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
