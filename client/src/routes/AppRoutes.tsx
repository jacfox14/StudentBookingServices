import { Route, Routes } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import Landing from "@/pages/shared/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Forbidden from "@/pages/shared/Forbidden";
import NotFound from "@/pages/shared/NotFound";
import Notifications from "@/pages/shared/Notifications";
import Profile from "@/pages/shared/Profile";

import StudentDashboard from "@/pages/student/Dashboard";
import StudentServices from "@/pages/student/Services";
import ServiceDetail from "@/pages/student/ServiceDetail";
import BookingConfirmation from "@/pages/student/BookingConfirmation";
import MyBookings from "@/pages/student/MyBookings";
import BookingDetail from "@/pages/student/BookingDetail";

import ProviderDashboard from "@/pages/provider/Dashboard";
import ProviderSchedule from "@/pages/provider/Schedule";
import ProviderRequests from "@/pages/provider/Requests";
import ProviderMyBookings from "@/pages/provider/MyBookings";
import ProviderBookingDetail from "@/pages/provider/BookingDetail";
import ProviderProfile from "@/pages/provider/Profile";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminServices from "@/pages/admin/Services";
import AdminReports from "@/pages/admin/Reports";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/403" element={<Forbidden />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<RoleRoute roles={["student"]} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/services" element={<StudentServices />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/bookings/:id/confirm" element={<BookingConfirmation />} />
          </Route>

          <Route element={<RoleRoute roles={["staff"]} />}>
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/provider/schedule" element={<ProviderSchedule />} />
            <Route path="/provider/bookings" element={<ProviderMyBookings />} />
            <Route path="/provider/bookings/:id" element={<ProviderBookingDetail />} />
            <Route path="/provider/requests" element={<ProviderRequests />} />
            <Route path="/provider/profile" element={<ProviderProfile />} />
          </Route>

          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
