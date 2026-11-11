
import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DonorSettings from "./pages/donor/DonorSettings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import DonorDashboard from "./pages/donor/DonorDashboard";
import CreateDonation from "./pages/donor/CreateDonation";
import MyDonations from "./pages/donor/MyDonations";
import DonationDetails from "./pages/donor/DonationDetails";

import NGODashboard from "./pages/ngo/NGODashboard";
import NGOAvailableDonations from "./pages/ngo/NGOAvailableDonations";
import NGODonationDetails from "./pages/ngo/NGODonationDetails";
import NGOMyCollections from "./pages/ngo/NGOMyCollections";
import NGOProfile from "./pages/ngo/NGOProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import NGOVerification from "./pages/admin/NGOVerification";
import UserManagement from "./pages/admin/UserManagement";
import AdminDonations from "./pages/admin/AdminDonations";

import Notifications from "./pages/shared/Notifications";

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Donor Routes */}
                    <Route element={<ProtectedRoute allowedRoles={["donor"]} />}>
                        <Route path="/donor/dashboard" element={<DonorDashboard />} />
                        <Route path="/donor/donations/new" element={<CreateDonation />} />
                        <Route path="/donor/donations" element={<MyDonations />} />
                        <Route path="/donor/donations/:id" element={<DonationDetails />} />
                        <Route path="/donor/notifications" element={<Notifications role="donor" />} />
                        <Route path="/donor/settings" element={<DonorSettings />} />
                    </Route>

                    {/* NGO Routes */}
                    <Route element={<ProtectedRoute allowedRoles={["ngo"]} />}>
                        <Route path="/ngo/dashboard" element={<NGODashboard />} />
                        <Route path="/ngo/notifications" element={<Notifications role="ngo" />} />
                        <Route path="/ngo/donations" element={<NGOAvailableDonations />} />
                        <Route path="/ngo/donations/:id" element={<NGODonationDetails />} />
                        <Route path="/ngo/collections" element={<NGOMyCollections />} />
                        <Route path="/ngo/profile" element={<NGOProfile />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/ngos" element={<NGOVerification />} />
                        <Route path="/admin/users" element={<UserManagement />} />
                        <Route path="/admin/donations" element={<AdminDonations />} />
                        <Route path="/admin/notifications" element={<Notifications role="admin" />} />
                    </Route>

                    <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                    />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
