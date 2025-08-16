import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/stats-card";
import { Users, Check, Clock, X, Plus, List, BarChart3, Settings } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: recentAttendance } = useQuery({
    queryKey: ["/api/attendance", "recent"],
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Admin</h2>
        <p className="text-gray-600">Kelola data siswa dan sistem presensi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Siswa"
          value={stats?.totalStudents || 0}
          icon={Users}
          iconColor="text-primary"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Hadir Hari Ini"
          value={stats?.presentToday || 0}
          icon={Check}
          iconColor="text-secondary"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Terlambat"
          value={stats?.lateToday || 0}
          icon={Clock}
          iconColor="text-accent"
          iconBgColor="bg-orange-100"
        />
        <StatsCard
          title="Tidak Hadir"
          value={(stats?.absentToday || 0) + (stats?.sickToday || 0) + (stats?.permissionToday || 0)}
          icon={X}
          iconColor="text-error"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/students">
          <Button className="btn-primary" data-testid="button-add-student">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Siswa
          </Button>
        </Link>
        <Link href="/students">
          <Button variant="secondary" data-testid="button-student-list">
            <List className="h-4 w-4 mr-2" />
            Daftar Siswa
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700" data-testid="button-reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Laporan
          </Button>
        </Link>
        <Button variant="outline" className="bg-gray-500 text-white hover:bg-gray-600" data-testid="button-settings">
          <Settings className="h-4 w-4 mr-2" />
          Pengaturan
        </Button>
      </div>

      {/* Recent Activity */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-xl">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAttendance && recentAttendance.length > 0 ? (
              recentAttendance.slice(0, 5).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      record.status === 'present' ? 'bg-green-100' :
                      record.status === 'late' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      {record.status === 'present' ? (
                        <Check className="h-4 w-4 text-secondary" />
                      ) : record.status === 'late' ? (
                        <Clock className="h-4 w-4 text-accent" />
                      ) : (
                        <Users className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900" data-testid={`activity-student-${record.student.name}`}>
                        {record.student.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Presensi {record.status === 'late' ? '(Terlambat)' : ''} - {record.student.class}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500" data-testid={`activity-time-${record.id}`}>
                    {new Date(record.time).toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Belum ada aktivitas hari ini</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
