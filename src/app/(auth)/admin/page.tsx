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
import { Upload, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

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
  };

  return (
    <Card className="w-full space-y-6">
      <CardHeader>
        <CardTitle>
          {formData.id ? "Edit Command" : "Add New Command"}
        </CardTitle>
        <CardDescription className="flex justify-between">
          Create or update a command with optional image upload
          <Link href={"/"}>
            <Button variant={"link"}>Voltar</Button>
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="command">Command *</Label>
            <Input
              id="command"
              type="text"
              placeholder="e.g., ls -la"
              value={formData.command}
              onChange={(e) => handleInputChange("command", e.target.value)}
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
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Category *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange("categoria", value)}
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
          <div className="space-y-2">
            <Label htmlFor="response">Response *</Label>
            <Textarea
              id="response"
              placeholder="Describe the command usage"
              value={formData.response}
              onChange={(e) => handleInputChange("response", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-upload">Command Screenshot (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
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
          {message && (
            <Alert
              className={
                message.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }
            >
              {message.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription
                className={
                  message.type === "error" ? "text-red-800" : "text-green-800"
                }
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : formData.id
              ? "Update Command"
              : "Create Command"}
          </Button>
        </form>

        {/* Lista de comandos existentes */}
        <div className="pt-10 space-y-4">
          <h2 className="text-lg font-semibold">Existing Commands</h2>
          {comandos.map((cmd) => (
            <div
              key={cmd.id}
              className="flex justify-between items-center border rounded p-4"
            >
              <div>
                <p className="font-medium">{cmd.command}</p>
                <p className="text-sm text-gray-500">{cmd.title}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(cmd)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
