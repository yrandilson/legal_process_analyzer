import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processNumber, setProcessNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = trpc.useUtils();
  const { data: uploadedDocuments = [], refetch: refetchDocuments } = trpc.documents.listMine.useQuery();

  const uploadAndProcess = trpc.documents.uploadAndProcess.useMutation({
    onSuccess: async () => {
      await utils.documents.listMine.invalidate();
      await utils.deadlines.listMine.invalidate();
      await utils.processes.list.invalidate();
      await refetchDocuments();
    },
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Falha ao ler arquivo"));
          return;
        }
        const base64 = result.split(",")[1];
        if (!base64) {
          reject(new Error("Falha ao converter arquivo para base64"));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Por favor, selecione um arquivo PDF");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Por favor, selecione um arquivo PDF");
      }
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo PDF");
      return;
    }

    if (!processNumber.trim()) {
      toast.error("Por favor, insira o número do processo");
      return;
    }

    if (!clientName.trim()) {
      toast.error("Por favor, insira o nome do cliente");
      return;
    }

    try {
      setIsProcessing(true);

      const fileBase64 = await fileToBase64(selectedFile);

      const response = await uploadAndProcess.mutateAsync({
        processNumber: processNumber.trim(),
        clientName: clientName.trim(),
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/pdf",
        fileSize: selectedFile.size,
        fileBase64,
      });

      // Limpar formulário
      setSelectedFile(null);
      setProcessNumber("");
      setClientName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(`Documento processado com sucesso! ${response.createdDeadlines} prazo(s) criado(s).`);
    } catch (error: any) {
      console.error("Erro ao enviar documento:", error);
      toast.error(error.message || "Erro ao enviar documento");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Documentos
            </CardTitle>
            <CardDescription>
              Envie publicações do Diário Oficial e intimações judiciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações do Processo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Informações do Processo</h3>

                <div className="space-y-2">
                  <Label htmlFor="processNumber">Número do Processo *</Label>
                  <Input
                    id="processNumber"
                    placeholder="Ex: 0001234-56.2024.8.26.0100"
                    value={processNumber}
                    onChange={(e) => setProcessNumber(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    placeholder="Ex: João Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Upload de Arquivo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Documento</h3>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                  onClick={handleSelectFileClick}
                >
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 mb-2">
                    Arraste um arquivo PDF aqui ou clique para selecionar
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">{selectedFile.name}</p>
                        <p className="text-sm text-green-700">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      disabled={isProcessing}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <Button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Documentos Enviados */}
        {uploadedDocuments.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Inbox de Processamento ({uploadedDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-900">{doc.fileName}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        doc.status === "processed"
                          ? "bg-green-100 text-green-700"
                          : doc.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {doc.status === "processed"
                        ? "processado"
                        : doc.status === "processing"
                          ? "processando"
                          : doc.status === "failed"
                            ? "falhou"
                            : doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
