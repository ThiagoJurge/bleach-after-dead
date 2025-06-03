"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface FormData {
  id?: string;
  command: string;
  title: string;
  categoria: string;
  response: string;
}

export default function ComandosForm() {
  const [formData, setFormData] = useState<FormData>({
    command: "",
    title: "",
    categoria: "",
    response: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [comandos, setComandos] = useState<FormData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("comandos").select("categoria");
    if (!error && data) {
      const unique = [...new Set(data.map((d) => d.categoria))];
      setCategories(unique);
      // Inicializa todas as categorias como expandidas
      const initialExpanded = unique.reduce((acc, cat) => {
        acc[cat] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setExpandedCategories(initialExpanded);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const fetchComandos = async () => {
    const { data, error } = await supabase
      .from("comandos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setComandos(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchComandos();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Por favor selecione um arquivo de imagem válido" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "O arquivo deve ser menor que 5MB" });
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setMessage(null);
  };

  const uploadImage = async (
    file: File,
    command: string
  ): Promise<string | null> => {
    try {
      const fileName = `${command}.jpg`;
      const filePath = `images/assets/${fileName}`;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob(
            async (blob) => {
              if (!blob) return reject("Falha ao converter imagem");
              const { data, error } = await supabase.storage
                .from("images")
                .upload(`assets/${fileName}`, blob, {
                  contentType: "image/jpeg",
                  upsert: true,
                });
              if (error) reject(error);
              else resolve(data.path);
            },
            "image/jpeg",
            0.9
          );
        };
        img.onerror = () => reject("Falha ao carregar imagem");
        img.src = URL.createObjectURL(file);
      });
    } catch (err) {
      console.error("Falha no upload da imagem", err);
      return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const categoria = newCategory || formData.categoria;

    if (
      !formData.command ||
      !formData.title ||
      !categoria ||
      !formData.response
    ) {
      setMessage({ type: "error", text: "Por favor preencha todos os campos obrigatórios" });
      setIsLoading(false);
      return;
    }

    try {
      let imagePath = null;
      if (selectedFile) {
        imagePath = await uploadImage(selectedFile, formData.command);
        if (!imagePath) throw new Error("Falha no upload da imagem");
      }

      const payload = {
        command: formData.command,
        title: formData.title,
        categoria,
        response: formData.response,
      };

      let result;
      if (formData.id) {
        result = await supabase
          .from("comandos")
          .update(payload)
          .eq("id", formData.id);
      } else {
        result = await supabase.from("comandos").insert([payload]);
      }

      if (result.error) throw result.error;

      setMessage({
        type: "success",
        text: `Comando ${formData.id ? "atualizado" : "criado"} com sucesso!`,
      });
      setFormData({ command: "", title: "", categoria: "", response: "" });
      setNewCategory("");
      setSelectedFile(null);
      setImagePreview(null);
      (document.getElementById("image-upload") as HTMLInputElement).value = "";
      fetchCategories();
      fetchComandos();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao salvar comando",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cmd: FormData) => {
    setFormData(cmd);
    setImagePreview(null);
    setSelectedFile(null);
    setNewCategory("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este comando?")) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("comandos").delete().eq("id", id);
      if (error) throw error;

      setMessage({ type: "success", text: "Comando excluído com sucesso" });
      fetchComandos();
      fetchCategories();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao excluir comando",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({ command: "", title: "", categoria: "", response: "" });
    setNewCategory("");
    setSelectedFile(null);
    setImagePreview(null);
    (document.getElementById("image-upload") as HTMLInputElement).value = "";
  };

  const comandosPorCategoria = comandos.reduce((acc, cmd) => {
    if (!acc[cmd.categoria]) {
      acc[cmd.categoria] = [];
    }
    acc[cmd.categoria].push(cmd);
    return acc;
  }, {} as Record<string, FormData[]>);

  return (
    <div className="container mx-auto px-4 py-8 bg-[#0a0a0a] text-[#e0e0e0]">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Seção do Formulário */}
        <div className="lg:w-1/2">
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#4a9be6]">
                    {formData.id ? "Editar Comando" : "Adicionar Novo Comando"}
                  </CardTitle>
                  <CardDescription className="text-[#888]">
                    {formData.id
                      ? "Atualize os detalhes do comando"
                      : "Crie um novo comando com imagem opcional"}
                  </CardDescription>
                </div>
                <Link href={"/"}>
                  <Button variant="ghost" size="icon" className="text-[#4a9be6] hover:bg-[#333]">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="command" className="text-[#e0e0e0]">Comando *</Label>
                    <Input
                      id="command"
                      type="text"
                      placeholder="ex: ls -la"
                      value={formData.command}
                      onChange={(e) =>
                        handleInputChange("command", e.target.value)
                      }
                      className="bg-[#222] border-[#333] text-[#e0e0e0]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-[#e0e0e0]">Título *</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="ex: Listar todos os arquivos"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="bg-[#222] border-[#333] text-[#e0e0e0]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="text-[#e0e0e0]">Categoria *</Label>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) =>
                          handleInputChange("categoria", value)
                        }
                        disabled={!!newCategory}
                      >
                        <SelectTrigger className="bg-[#222] border-[#333] text-[#e0e0e0]">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#222] border-[#333] text-[#e0e0e0]">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="hover:bg-[#333]">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Ou digite uma nova categoria"
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          if (e.target.value)
                            setFormData((f) => ({ ...f, categoria: "" }));
                        }}
                        className="bg-[#222] border-[#333] text-[#e0e0e0]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response" className="text-[#e0e0e0]">Resposta *</Label>
                    <Textarea
                      id="response"
                      placeholder="Descreva o uso do comando"
                      value={formData.response}
                      onChange={(e) =>
                        handleInputChange("response", e.target.value)
                      }
                      className="min-h-[120px] bg-[#222] border-[#333] text-[#e0e0e0]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-upload" className="text-[#e0e0e0]">
                      Captura de Tela do Comando (Opcional)
                    </Label>
                    <div className="border-2 border-dashed border-[#333] rounded-lg p-6 text-center hover:border-[#4a9be6] transition-colors">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                      >
                        <Upload className="mx-auto h-12 w-12 text-[#4a9be6] mb-4" />
                        <p className="text-sm text-[#888] mb-2">
                          Clique para enviar ou arraste a imagem
                        </p>
                        <p className="text-xs text-[#555]">
                          PNG, JPG, GIF até 5MB
                        </p>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-48 object-contain rounded-lg border border-[#333]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {message && (
                  <Alert
                    variant={
                      message.type === "error" ? "destructive" : "default"
                    }
                    className="mt-4 border-[#333]"
                  >
                    {message.type === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-[#4a9be6]" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#4a9be6] hover:bg-[#3a8bd6] text-white"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Salvando..."
                      : formData.id
                      ? "Atualizar Comando"
                      : "Criar Comando"}
                  </Button>
                  {formData.id && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isLoading}
                      className="border-[#333] text-[#e0e0e0] hover:bg-[#333]"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Lista de Comandos */}
        <div className="lg:w-1/2">
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-[#4a9be6]">Comandos Existentes</CardTitle>
              <CardDescription className="text-[#888]">
                {comandos.length} comandos em {categories.length} categorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-[#888]">
                  Nenhum comando encontrado. Crie o primeiro!
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((categoria) => (
                    <div key={categoria} className="border border-[#333] rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 bg-[#222] cursor-pointer"
                        onClick={() => toggleCategory(categoria)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-[#4a9be6]">
                            {comandosPorCategoria[categoria]?.length || 0}
                          </Badge>
                          <span className="font-medium text-[#e0e0e0]">{categoria}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-[#4a9be6] hover:bg-[#333]"
                        >
                          {expandedCategories[categoria] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {expandedCategories[categoria] && (
                        <Table className="border-t border-[#333]">
                          <TableHeader className="bg-[#222]">
                            <TableRow>
                              <TableHead className="text-[#e0e0e0]">Comando</TableHead>
                              <TableHead className="text-[#e0e0e0]">Título</TableHead>
                              <TableHead className="text-right text-[#e0e0e0]">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {comandosPorCategoria[categoria]?.map((cmd) => (
                              <TableRow key={cmd.id} className="border-[#333] hover:bg-[#222]">
                                <TableCell className="font-medium">
                                  <code className="bg-[#222] px-2 py-1 rounded text-[#4a9be6]">
                                    {cmd.command}
                                  </code>
                                </TableCell>
                                <TableCell className="text-[#e0e0e0]">{cmd.title}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(cmd)}
                                        className="text-[#4a9be6] hover:bg-[#333]"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#222] text-[#e0e0e0] border-[#333]">Editar</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => cmd.id && handleDelete(cmd.id)}
                                        disabled={isDeleting}
                                        className="text-red-500 hover:bg-[#333]"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#222] text-[#e0e0e0] border-[#333]">Excluir</TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}