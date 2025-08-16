import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import StatsCard from "@/components/stats-card";
import { TrendingUp, Clock, AlertTriangle, FileSpreadsheet, FileText, Calendar, Download, Search } from "lucide-react";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const { data: attendanceReport, isLoading } = useQuery({
    queryKey: ["/api/reports/attendance", startDate, endDate, selectedClass],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedClass && selectedClass !== 'all') params.append('class', selectedClass);
      
      const url = `/api/reports/attendance${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) return [];
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      
      return await res.json();
    },
  });

  const handleExportCSV = (reportType: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (selectedClass && selectedClass !== 'all') params.append('class', selectedClass);
    
    window.open(`/api/export/attendance-csv?${params.toString()}`, '_blank');
  };

  const handleQuickReport = (type: 'daily' | 'weekly' | 'monthly') => {
    const today = new Date();
    let start, end;

    switch (type) {
      case 'daily':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        start = weekStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = monthStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const calculateAverageAttendance = () => {
    if (!attendanceReport || attendanceReport.length === 0) return 0;
    
    const totalAttendance = attendanceReport.reduce((sum: number, record: any) => sum + record.percentage, 0);
    return Math.round((totalAttendance / attendanceReport.length) * 10) / 10;
  };

  const getTotalLate = () => {
    if (!attendanceReport) return 0;
    return attendanceReport.reduce((sum: number, record: any) => sum + record.late, 0);
  };

  const getProblematicStudents = () => {
    if (!attendanceReport) return 0;
    return attendanceReport.filter((record: any) => record.percentage < 75).length;
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Laporan Presensi</h2>
        <p className="text-gray-600">Analisis kehadiran siswa dan export data</p>
      </div>

      {/* Report Filters */}
      <Card className="card mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="end-date">Tanggal Akhir</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div>
              <Label htmlFor="class-select">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
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
            <div className="flex items-end">
              <Button className="w-full btn-primary" data-testid="button-generate-report">
                <Search className="h-4 w-4 mr-2" />
                Generate Laporan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Rata-rata Kehadiran"
          value={`${calculateAverageAttendance()}%`}
          icon={TrendingUp}
          iconColor="text-secondary"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Total Keterlambatan"
          value={getTotalLate()}
          icon={Clock}
          iconColor="text-accent"
          iconBgColor="bg-orange-100"
        />
        <StatsCard
          title="Siswa Bermasalah"
          value={getProblematicStudents()}
          icon={AlertTriangle}
          iconColor="text-error"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Export and Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-lg">Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => handleExportCSV('excel')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                variant="outline"
                data-testid="button-export-excel"
              >
                <div className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Export ke Excel</p>
                    <p className="text-sm text-gray-500">Data lengkap dengan formatting</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </Button>
              <Button
                onClick={() => handleExportCSV('csv')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                variant="outline"
                data-testid="button-export-csv"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Export ke CSV</p>
                    <p className="text-sm text-gray-500">Data mentah untuk analisis</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </Button>
              <Button
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                variant="outline"
                data-testid="button-export-pdf"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Export ke PDF</p>
                    <p className="text-sm text-gray-500">Laporan siap cetak</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-lg">Laporan Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => handleQuickReport('daily')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                variant="outline"
                data-testid="button-daily-report"
              >
                <Calendar className="h-5 w-5 text-primary mr-3 inline" />
                <div className="inline-block">
                  <p className="font-medium text-gray-900">Laporan Harian</p>
                  <p className="text-sm text-gray-500">Presensi hari ini</p>
                </div>
              </Button>
              <Button
                onClick={() => handleQuickReport('weekly')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                variant="outline"
                data-testid="button-weekly-report"
              >
                <Calendar className="h-5 w-5 text-primary mr-3 inline" />
                <div className="inline-block">
                  <p className="font-medium text-gray-900">Laporan Mingguan</p>
                  <p className="text-sm text-gray-500">7 hari terakhir</p>
                </div>
              </Button>
              <Button
                onClick={() => handleQuickReport('monthly')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                variant="outline"
                data-testid="button-monthly-report"
              >
                <Calendar className="h-5 w-5 text-primary mr-3 inline" />
                <div className="inline-block">
                  <p className="font-medium text-gray-900">Laporan Bulanan</p>
                  <p className="text-sm text-gray-500">Bulan ini</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card className="card">
        <CardHeader>
          <CardTitle>Data Presensi Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat laporan...</p>
            </div>
          ) : (
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
                      Hadir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terlambat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sakit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Izin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alpha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceReport && attendanceReport.length > 0 ? (
                    attendanceReport.map((record: any, index: number) => (
                      <tr key={record.student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors[index % colors.length]}`}>
                              <span className="font-semibold text-sm" data-testid={`report-initials-${record.student.id}`}>
                                {getInitials(record.student.name)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900" data-testid={`report-name-${record.student.id}`}>
                                {record.student.name}
                              </div>
                              <div className="text-sm text-gray-500" data-testid={`report-nis-${record.student.id}`}>
                                {record.student.nis}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`report-class-${record.student.id}`}>
                          {record.student.class}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-semibold" data-testid={`report-present-${record.student.id}`}>
                          {record.present}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-accent font-semibold" data-testid={`report-late-${record.student.id}`}>
                          {record.late}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold" data-testid={`report-sick-${record.student.id}`}>
                          {record.sick}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold" data-testid={`report-permission-${record.student.id}`}>
                          {record.permission}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-error font-semibold" data-testid={`report-absent-${record.student.id}`}>
                          {record.absent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" data-testid={`report-percentage-${record.student.id}`}>
                          {record.percentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">Tidak ada data laporan</p>
                        <p className="text-sm text-gray-400">Silakan pilih rentang tanggal untuk melihat laporan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
