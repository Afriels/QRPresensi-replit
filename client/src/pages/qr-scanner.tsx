import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Play, Square, Save, QrCode, Search, CheckCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState("present");
  const [notes, setNotes] = useState("");
  const [manualNis, setManualNis] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const studentSearchMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await apiRequest("POST", "/api/students/search-by-qr", { qrCode });
      return response.json();
    },
    onSuccess: (student) => {
      setScannedStudent(student);
      stopScanner();
      toast({
        title: "QR Code berhasil discan!",
        description: `Siswa: ${student.name} - ${student.class}`,
      });
    },
    onError: (error) => {
      toast({
        title: "QR Code tidak valid",
        description: error.message || "Siswa tidak ditemukan",
        variant: "destructive",
      });
    },
  });

  const manualSearchMutation = useMutation({
    mutationFn: async (nis: string) => {
      const response = await apiRequest("GET", `/api/students?search=${nis}`);
      const students = await response.json();
      const student = students.find((s: any) => s.nis === nis);
      if (!student) throw new Error("Siswa tidak ditemukan");
      return student;
    },
    onSuccess: (student) => {
      setScannedStudent(student);
      toast({
        title: "Siswa ditemukan!",
        description: `${student.name} - ${student.class}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Siswa tidak ditemukan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/attendance", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Presensi berhasil disimpan!",
        description: "Data kehadiran telah tercatat",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setScannedStudent(null);
      setNotes("");
      setAttendanceStatus("present");
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan presensi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startScanner = () => {
    setIsScanning(true);
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        studentSearchMutation.mutate(decodedText);
      },
      (errorMessage) => {
        // Handle scan errors silently
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleSaveAttendance = () => {
    if (!scannedStudent) return;

    const currentTime = new Date();
    const status = attendanceStatus === "present" && currentTime.getHours() > 7 ? "late" : attendanceStatus;

    attendanceMutation.mutate({
      studentId: scannedStudent.id,
      status,
      notes,
    });
  };

  const handleManualSearch = () => {
    if (!manualNis.trim()) return;
    manualSearchMutation.mutate(manualNis.trim());
  };

  const handleScanAnother = () => {
    setScannedStudent(null);
    setNotes("");
    setAttendanceStatus("present");
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Scan QR Code Siswa</h2>
          <p className="text-gray-600">Arahkan kamera ke QR code untuk presensi</p>
        </div>

        {/* Scanner Interface */}
        <Card className="card mb-6">
          <CardContent className="p-6">
            <div id="qr-reader" className="mb-4">
              {!isScanning && (
                <div className="bg-gray-900 rounded-lg aspect-square flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="mx-auto h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg mb-2">Kamera akan aktif di sini</p>
                    <p className="text-sm opacity-75">Pastikan izin kamera diaktifkan</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={startScanner}
                disabled={isScanning}
                className="btn-primary"
                data-testid="button-start-scanner"
              >
                <Play className="h-4 w-4 mr-2" />
                Mulai Scanner
              </Button>
              <Button
                onClick={stopScanner}
                disabled={!isScanning}
                variant="secondary"
                data-testid="button-stop-scanner"
              >
                <Square className="h-4 w-4 mr-2" />
                Berhenti
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scan Result */}
        {scannedStudent && (
          <Card className="card mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <CheckCircle className="mx-auto h-12 w-12 text-secondary mb-3" />
                <h3 className="text-xl font-semibold text-gray-800">QR Code Terdeteksi!</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nama Siswa</Label>
                    <p className="text-lg font-semibold" data-testid="scanned-student-name">
                      {scannedStudent.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Kelas</Label>
                    <p className="text-lg font-semibold" data-testid="scanned-student-class">
                      {scannedStudent.class}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">NIS</Label>
                    <p className="text-lg font-semibold" data-testid="scanned-student-nis">
                      {scannedStudent.nis}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Waktu Scan</Label>
                    <p className="text-lg font-semibold" data-testid="scan-time">
                      {new Date().toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Status Kehadiran</Label>
                <RadioGroup value={attendanceStatus} onValueChange={setAttendanceStatus}>
                  <div className="grid grid-cols-2 gap-3">
                    <Label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="present" className="mr-2" />
                      <span className="text-sm font-medium">Tepat Waktu</span>
                    </Label>
                    <Label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="late" className="mr-2" />
                      <span className="text-sm font-medium">Terlambat</span>
                    </Label>
                    <Label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="sick" className="mr-2" />
                      <span className="text-sm font-medium">Sakit</span>
                    </Label>
                    <Label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="permission" className="mr-2" />
                      <span className="text-sm font-medium">Izin</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Additional Notes */}
              <div className="mb-4">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                  Keterangan (Opsional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSaveAttendance}
                  className="flex-1 btn-secondary"
                  disabled={attendanceMutation.isPending}
                  data-testid="button-save-attendance"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {attendanceMutation.isPending ? 'Menyimpan...' : 'Simpan Presensi'}
                </Button>
                <Button
                  onClick={handleScanAnother}
                  variant="outline"
                  className="px-6"
                  data-testid="button-scan-another"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry Option */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-lg">Presensi Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Jika QR tidak dapat discan, gunakan input manual</p>
            <div className="flex space-x-3">
              <Input
                type="text"
                placeholder="Masukkan NIS siswa"
                value={manualNis}
                onChange={(e) => setManualNis(e.target.value)}
                className="flex-1"
                data-testid="input-manual-nis"
              />
              <Button
                onClick={handleManualSearch}
                className="btn-primary"
                disabled={manualSearchMutation.isPending}
                data-testid="button-manual-search"
              >
                <Search className="h-4 w-4 mr-2" />
                {manualSearchMutation.isPending ? 'Mencari...' : 'Cari'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
