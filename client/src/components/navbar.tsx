import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, GraduationCap, LogOut } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const logout = useLogout();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: "/", label: "Dashboard", show: true },
    { path: "/students", label: "Daftar Siswa", show: user?.role === 'admin' },
    { path: "/scanner", label: "Scan QR", show: user?.role === 'teacher' },
    { path: "/attendance", label: "Kehadiran", show: true },
    { path: "/reports", label: "Laporan", show: true },
  ].filter(item => item.show);

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80">
            <GraduationCap className="h-8 w-8" />
            <h1 className="text-xl font-medium">Sistem Absensi Siswa</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`text-white hover:bg-blue-600 ${
                    isActive(item.path) ? 'bg-blue-600' : ''
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-blue-600"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col space-y-4 mt-6">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive(item.path) ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => setIsOpen(false)}
                      data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600"
                  data-testid="mobile-button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
