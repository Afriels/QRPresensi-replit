import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ListChecks, Check, Clock, User, Hand } from "lucide-react";
import { Link } from "wouter";

export default function TeacherDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: recentScans } = useQuery({
    queryKey: ["/api/attendance", "teacher-recent"],
    queryFn: async () => {
      const url = `/api/attendance`;
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) return [];
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      
      const data = await res.json();
      return data.slice(0, 5); // Get first 5 records
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Guru</h2>
        <p className="text-gray-600">Scan QR siswa untuk presensi dan lihat daftar hadir</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="card">
          <CardContent className="p-6 text-center">
            <QrCode className="mx-auto h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Scan QR Code</h3>
            <p className="text-gray-600 mb-4">Arahkan kamera ke QR code siswa untuk presensi</p>
            <Link href="/scanner">
              <Button className="btn-primary" data-testid="button-start-scan">
                <QrCode className="h-4 w-4 mr-2" />
                Mulai Scan
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardContent className="p-6 text-center">
            <ListChecks className="mx-auto h-16 w-16 text-secondary mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Daftar Hadir</h3>
            <p className="text-gray-600 mb-4">Lihat daftar siswa yang sudah presensi hari ini</p>
            <Link href="/attendance">
              <Button className="btn-secondary" data-testid="button-view-attendance">
                <ListChecks className="h-4 w-4 mr-2" />
                Lihat Daftar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card className="card mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Ringkasan Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Check className="mx-auto h-8 w-8 text-secondary mb-2" />
              <p className="text-2xl font-bold text-secondary" data-testid="summary-present">
                {(stats?.presentToday || 0) + (stats?.lateToday || 0)}
              </p>
              <p className="text-sm text-gray-600">Hadir</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Clock className="mx-auto h-8 w-8 text-accent mb-2" />
              <p className="text-2xl font-bold text-accent" data-testid="summary-late">
                {stats?.lateToday || 0}
              </p>
              <p className="text-sm text-gray-600">Terlambat</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <User className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600" data-testid="summary-sick">
                {stats?.sickToday || 0}
              </p>
              <p className="text-sm text-gray-600">Sakit</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Hand className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-600" data-testid="summary-permission">
                {stats?.permissionToday || 0}
              </p>
              <p className="text-sm text-gray-600">Izin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl">Scan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentScans && recentScans.length > 0 ? (
              recentScans.slice(0, 5).map((scan: any) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      scan.status === 'present' ? 'bg-green-100' :
                      scan.status === 'late' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      {scan.status === 'present' ? (
                        <Check className="h-5 w-5 text-secondary" />
                      ) : scan.status === 'late' ? (
                        <Clock className="h-5 w-5 text-accent" />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900" data-testid={`scan-student-${scan.student.name}`}>
                        {scan.student.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {scan.student.class} - {
                          scan.status === 'present' ? 'Tepat Waktu' :
                          scan.status === 'late' ? 'Terlambat' :
                          scan.status === 'sick' ? 'Sakit' :
                          scan.status === 'permission' ? 'Izin' : 'Alpha'
                        }
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500" data-testid={`scan-time-${scan.id}`}>
                    {new Date(scan.time).toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QrCode className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Belum ada scan hari ini</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
