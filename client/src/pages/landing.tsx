import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { QrCode, Shield, Presentation, Camera, TrendingUp } from "lucide-react";

export default function Landing() {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginType, setLoginType] = useState<'admin' | 'teacher' | null>(null);
  const login = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) return;
    
    login.mutate(loginForm);
  };

  const handleQuickLogin = (type: 'admin' | 'teacher') => {
    const credentials = type === 'admin' 
      ? { username: 'admin', password: 'admin123' }
      : { username: 'teacher1', password: 'admin123' };
    
    setLoginForm(credentials);
    setLoginType(type);
  };

  return (
    <div className="min-h-screen bg-surface font-roboto">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <QrCode className="mx-auto h-16 w-16 text-primary mb-4" />
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Sistem Absensi QR Code</h1>
              <p className="text-xl text-gray-600">Solusi modern untuk presensi siswa dengan teknologi QR Code</p>
            </div>
          </div>

          {/* Login Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Admin Login */}
            <Card className="card">
              <CardHeader className="text-center">
                <Shield className="mx-auto h-12 w-12 text-primary mb-3" />
                <CardTitle className="text-2xl">Login Admin</CardTitle>
                <p className="text-gray-600 mt-2">Kelola data siswa dan sistem</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Masukkan username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      data-testid="input-admin-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      data-testid="input-admin-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={login.isPending}
                    data-testid="button-admin-login"
                  >
                    {login.isPending ? 'Loading...' : 'Login sebagai Admin'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleQuickLogin('admin')}
                    data-testid="button-admin-demo"
                  >
                    Demo Admin (admin/admin123)
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Teacher Login */}
            <Card className="card">
              <CardHeader className="text-center">
                <Presentation className="mx-auto h-12 w-12 text-secondary mb-3" />
                <CardTitle className="text-2xl">Login Guru</CardTitle>
                <p className="text-gray-600 mt-2">Scan QR dan kelola presensi</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="teacher-username">Username</Label>
                    <Input
                      id="teacher-username"
                      type="text"
                      placeholder="Masukkan username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      data-testid="input-teacher-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-password">Password</Label>
                    <Input
                      id="teacher-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      data-testid="input-teacher-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full btn-secondary"
                    disabled={login.isPending}
                    data-testid="button-teacher-login"
                  >
                    {login.isPending ? 'Loading...' : 'Login sebagai Guru'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleQuickLogin('teacher')}
                    data-testid="button-teacher-demo"
                  >
                    Demo Guru (teacher1/admin123)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Fitur Unggulan</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <QrCode className="mx-auto h-12 w-12 text-primary mb-4" />
                <h4 className="font-semibold text-gray-800 mb-2">QR Code Unik</h4>
                <p className="text-gray-600 text-sm">Setiap siswa memiliki QR code permanen yang unik</p>
              </div>
              <div className="text-center p-6">
                <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
                <h4 className="font-semibold text-gray-800 mb-2">Scan via Browser</h4>
                <p className="text-gray-600 text-sm">Tidak perlu aplikasi khusus, scan langsung di browser</p>
              </div>
              <div className="text-center p-6">
                <TrendingUp className="mx-auto h-12 w-12 text-primary mb-4" />
                <h4 className="font-semibold text-gray-800 mb-2">Laporan Lengkap</h4>
                <p className="text-gray-600 text-sm">Laporan presensi dengan export ke CSV</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
