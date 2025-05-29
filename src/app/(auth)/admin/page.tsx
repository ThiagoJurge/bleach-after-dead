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

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("comandos").select("categoria");
    if (!error && data) {
      const unique = [...new Set(data.map((d) => d.categoria))];
      setCategories(unique);
    }
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
      setMessage({ type: "error", text: "Please select a valid image file" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
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
              if (!blob) return reject("Failed to convert image");
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
        img.onerror = () => reject("Failed to load image");
        img.src = URL.createObjectURL(file);
      });
    } catch (err) {
      console.error("Image upload failed", err);
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
      setMessage({ type: "error", text: "Please fill in all required fields" });
      setIsLoading(false);
      return;
    }

    try {
      let imagePath = null;
      if (selectedFile) {
        imagePath = await uploadImage(selectedFile, formData.command);
        if (!imagePath) throw new Error("Image upload failed");
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
        text: `Command ${formData.id ? "updated" : "created"} successfully!`,
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
        text: error.message || "Error saving command",
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
    if (!confirm("Are you sure you want to delete this command?")) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("comandos").delete().eq("id", id);
      if (error) throw error;

      setMessage({ type: "success", text: "Command deleted successfully" });
      fetchComandos();
      fetchCategories();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Error deleting command",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Section */}
        <div className="lg:w-1/2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {formData.id ? "Edit Command" : "Add New Command"}
                  </CardTitle>
                  <CardDescription>
                    {formData.id
                      ? "Update the command details"
                      : "Create a new command with optional image"}
                  </CardDescription>
                </div>
                <Link href={"/"}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="command">Command *</Label>
                    <Input
                      id="command"
                      type="text"
                      placeholder="e.g., ls -la"
                      value={formData.command}
                      onChange={(e) =>
                        handleInputChange("command", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="e.g., List all files"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Category *</Label>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) =>
                          handleInputChange("categoria", value)
                        }
                        disabled={!!newCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Or type a new category"
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          if (e.target.value)
                            setFormData((f) => ({ ...f, categoria: "" }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response">Response *</Label>
                    <Textarea
                      id="response"
                      placeholder="Describe the command usage"
                      value={formData.response}
                      onChange={(e) =>
                        handleInputChange("response", e.target.value)
                      }
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-upload">
                      Command Screenshot (Optional)
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary transition-colors">
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
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Click to upload or drag image
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-48 object-contain rounded-lg border"
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
                    className="mt-4"
                  >
                    {message.type === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading
                      ? "Saving..."
                      : formData.id
                      ? "Update Command"
                      : "Create Command"}
                  </Button>
                  {formData.id && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Commands List Section */}
        <div className="lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Commands</CardTitle>
              <CardDescription>
                {comandos.length} commands available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Command</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comandos.map((cmd) => (
                      <TableRow key={cmd.id}>
                        <TableCell className="font-medium">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {cmd.command}
                          </code>
                        </TableCell>
                        <TableCell>{cmd.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cmd.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(cmd)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cmd.id && handleDelete(cmd.id)}
                                disabled={isDeleting}
                              >
                                <Trash className="h-4 w-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {comandos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No commands found. Create your first one!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
