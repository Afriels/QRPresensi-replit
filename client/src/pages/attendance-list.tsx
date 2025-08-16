import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/stats-card";
import { Check, Clock, User, X, Filter, FileText, FileSpreadsheet } from "lucide-react";

export default function AttendanceList() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const today = new Date().toISOString().split('T')[0];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["/api/attendance", selectedClass, selectedStatus, today],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass && selectedClass !== 'all') params.append('class', selectedClass);
      if (selectedStatus && selectedStatus !== 'all' && selectedStatus !== '') params.append('status', selectedStatus);
      params.append('date', today);
      
      const url = `/api/attendance${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      
      return await res.json();
    },
  });

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.append('startDate', today);
    params.append('endDate', today);
    if (selectedClass) params.append('class', selectedClass);
    if (selectedStatus) params.append('status', selectedStatus);
    
    window.open(`/api/export/attendance-csv?${params.toString()}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'sick':
        return 'bg-blue-100 text-blue-800';
      case 'permission':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Tepat Waktu';
      case 'late':
        return 'Terlambat';
      case 'sick':
        return 'Sakit';
      case 'permission':
        return 'Izin';
      case 'absent':
        return 'Alpha';
      default:
        return status;
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

  if (isLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Daftar Kehadiran Hari Ini</h2>
        <p className="text-gray-600" data-testid="current-date">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Hadir"
          value={(stats?.presentToday || 0) + (stats?.lateToday || 0)}
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
          title="Sakit"
          value={stats?.sickToday || 0}
          icon={User}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Alpha"
          value={stats?.absentToday || 0}
          icon={X}
          iconColor="text-error"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Filter */}
      <Card className="card mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="present">Hadir</SelectItem>
                  <SelectItem value="late">Terlambat</SelectItem>
                  <SelectItem value="sick">Sakit</SelectItem>
                  <SelectItem value="permission">Izin</SelectItem>
                  <SelectItem value="absent">Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button className="w-full btn-primary" data-testid="button-filter">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div>
              <Button
                onClick={handleExportCSV}
                className="w-full bg-green-600 text-white hover:bg-green-700"
                data-testid="button-export-csv"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <div>
              <Button
                variant="outline"
                className="w-full bg-red-600 text-white hover:bg-red-700"
                data-testid="button-export-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
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
                  Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords && attendanceRecords.length > 0 ? (
                attendanceRecords.map((record: any, index: number) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors[index % colors.length]}`}>
                          <span className="font-semibold text-sm" data-testid={`attendance-initials-${record.id}`}>
                            {getInitials(record.student.name)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900" data-testid={`attendance-student-${record.id}`}>
                            {record.student.name}
                          </div>
                          <div className="text-sm text-gray-500" data-testid={`attendance-nis-${record.id}`}>
                            {record.student.nis}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`attendance-class-${record.id}`}>
                      {record.student.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`attendance-time-${record.id}`}>
                      {new Date(record.time).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(record.status)} data-testid={`attendance-status-${record.id}`}>
                        {getStatusText(record.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" data-testid={`attendance-notes-${record.id}`}>
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Check className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Belum ada data kehadiran hari ini</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
