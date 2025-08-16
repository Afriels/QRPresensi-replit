import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StudentForm from "@/components/student-form";
import QRCodeModal from "@/components/qr-code-modal";
import { Plus, Search, Edit, QrCode, Trash2, User } from "lucide-react";

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students", searchTerm, selectedClass],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedClass && selectedClass !== 'all') params.append('class', selectedClass);
      
      const url = `/api/students${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      
      return await res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Siswa berhasil dihapus",
        description: "Data siswa telah dihapus dari sistem",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus siswa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteStudent = (student: any) => {
    if (confirm(`Yakin ingin menghapus siswa ${student.name}?`)) {
      deleteMutation.mutate(student.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = ['bg-blue-100 text-blue-600', 'bg-pink-100 text-pink-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600'];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Daftar Siswa</h2>
        <p className="text-gray-600">Kelola data siswa dan QR code</p>
      </div>

      {/* Search and Filter */}
      <Card className="card mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-student"
              />
            </div>
            <div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class-filter">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  <SelectItem value="X IPA 1">X IPA 1</SelectItem>
                  <SelectItem value="X IPA 2">X IPA 2</SelectItem>
                  <SelectItem value="XI IPA 1">XI IPA 1</SelectItem>
                  <SelectItem value="XI IPA 2">XI IPA 2</SelectItem>
                  <SelectItem value="XII IPA 1">XII IPA 1</SelectItem>
                  <SelectItem value="XII IPA 2">XII IPA 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button className="w-full btn-primary" data-testid="button-search">
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
            </div>
            <div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full btn-secondary"
                data-testid="button-add-student"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Siswa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students && students.length > 0 ? (
                students.map((student: any, index: number) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[index % colors.length]}`}>
                          <span className="font-semibold text-sm" data-testid={`student-initials-${student.id}`}>
                            {getInitials(student.name)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900" data-testid={`student-name-${student.id}`}>
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500" data-testid={`student-nis-${student.id}`}>
                            NIS: {student.nis}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900" data-testid={`student-class-${student.id}`}>
                        {student.class}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedStudentForQR(student)}
                        className="text-primary hover:text-blue-700"
                        data-testid={`button-view-qr-${student.id}`}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        Lihat QR
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={student.isActive ? "default" : "secondary"}>
                        {student.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-900"
                        data-testid={`button-edit-${student.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudentForQR(student)}
                        className="text-green-600 hover:text-green-900"
                        data-testid={`button-qr-${student.id}`}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student)}
                        className="text-red-600 hover:text-red-900"
                        data-testid={`button-delete-${student.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Tidak ada siswa ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Student Form Modal */}
      {(showAddForm || editingStudent) && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowAddForm(false);
            setEditingStudent(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingStudent(null);
            queryClient.invalidateQueries({ queryKey: ["/api/students"] });
          }}
        />
      )}

      {/* QR Code Modal */}
      {selectedStudentForQR && (
        <QRCodeModal
          student={selectedStudentForQR}
          onClose={() => setSelectedStudentForQR(null)}
        />
      )}
    </div>
  );
}
