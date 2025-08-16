import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema } from "@shared/schema";
import { z } from "zod";
import { Save, X } from "lucide-react";

interface StudentFormProps {
  student?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const studentFormSchema = insertStudentSchema.extend({
  birthDate: z.string().optional(),
});

export default function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
  const [formData, setFormData] = useState({
    name: student?.name || "",
    nis: student?.nis || "",
    class: student?.class || "",
    gender: student?.gender || "",
    birthDate: student?.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : "",
    address: student?.address || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      };

      if (student) {
        const response = await apiRequest("PUT", `/api/students/${student.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/students", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: student ? "Siswa berhasil diupdate" : "Siswa berhasil ditambahkan",
        description: student ? "Data siswa telah diperbarui" : "Siswa baru telah ditambahkan ke sistem",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      onSuccess();
    },
    onError: (error: any) => {
      if (error.message.includes("errors")) {
        const errorData = JSON.parse(error.message.split("errors: ")[1]);
        const fieldErrors: Record<string, string> = {};
        errorData.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Gagal menyimpan siswa",
          description: error.message || "Terjadi kesalahan saat menyimpan data siswa",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = studentFormSchema.parse(formData);
      mutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {student ? "Edit Siswa" : "Tambah Siswa Baru"}
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-form">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
              data-testid="input-student-name"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="nis">NIS *</Label>
            <Input
              id="nis"
              type="text"
              placeholder="Nomor Induk Siswa"
              value={formData.nis}
              onChange={(e) => handleInputChange("nis", e.target.value)}
              className={errors.nis ? "border-red-500" : ""}
              data-testid="input-student-nis"
            />
            {errors.nis && <p className="text-sm text-red-500 mt-1">{errors.nis}</p>}
          </div>

          <div>
            <Label htmlFor="class">Kelas *</Label>
            <Select value={formData.class} onValueChange={(value) => handleInputChange("class", value)}>
              <SelectTrigger className={errors.class ? "border-red-500" : ""} data-testid="select-student-class">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X IPA 1">X IPA 1</SelectItem>
                <SelectItem value="X IPA 2">X IPA 2</SelectItem>
                <SelectItem value="XI IPA 1">XI IPA 1</SelectItem>
                <SelectItem value="XI IPA 2">XI IPA 2</SelectItem>
                <SelectItem value="XII IPA 1">XII IPA 1</SelectItem>
                <SelectItem value="XII IPA 2">XII IPA 2</SelectItem>
                <SelectItem value="X IPS 1">X IPS 1</SelectItem>
                <SelectItem value="X IPS 2">X IPS 2</SelectItem>
                <SelectItem value="XI IPS 1">XI IPS 1</SelectItem>
                <SelectItem value="XI IPS 2">XI IPS 2</SelectItem>
                <SelectItem value="XII IPS 1">XII IPS 1</SelectItem>
                <SelectItem value="XII IPS 2">XII IPS 2</SelectItem>
              </SelectContent>
            </Select>
            {errors.class && <p className="text-sm text-red-500 mt-1">{errors.class}</p>}
          </div>

          <div>
            <Label htmlFor="gender">Jenis Kelamin *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
              <SelectTrigger className={errors.gender ? "border-red-500" : ""} data-testid="select-student-gender">
                <SelectValue placeholder="Pilih Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
          </div>

          <div>
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
              className={errors.birthDate ? "border-red-500" : ""}
              data-testid="input-student-birthdate"
            />
            {errors.birthDate && <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              placeholder="Alamat lengkap"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={3}
              className={errors.address ? "border-red-500" : ""}
              data-testid="input-student-address"
            />
            {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-form"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-primary"
              disabled={mutation.isPending}
              data-testid="button-submit-form"
            >
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
