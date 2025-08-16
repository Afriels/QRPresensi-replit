import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentList from "@/pages/student-list";
import QRScanner from "@/pages/qr-scanner";
import AttendanceList from "@/pages/attendance-list";
import Reports from "@/pages/reports";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Switch>
        <Route path="/" component={user.role === 'admin' ? AdminDashboard : TeacherDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/teacher" component={TeacherDashboard} />
        <Route path="/students" component={StudentList} />
        <Route path="/scanner" component={QRScanner} />
        <Route path="/attendance" component={AttendanceList} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
