
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [role, setRole] = useState("donor");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        organizationName: "",
        registrationNumber: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (form.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            phone: form.phone.trim(),
            address: form.address.trim(),
            role
        };

        if (role === "ngo") {
            payload.organizationName = form.organizationName.trim();
            payload.registrationNumber = form.registrationNumber.trim();
        }

        try {
            await register(payload);
            setSuccess(
                role === "ngo"
                    ? "Registration successful! Your NGO account must be verified by an admin before you can access NGO features."
                    : "Registration successful! You can now sign in."
            );

            setTimeout(() => navigate("/login"), 2200);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Registration failed. Please check your details."
            );
        }
    };

    return (
        <div className="auth-page">
            <section className="auth-visual">
                <div className="auth-brand">
                    Food<span>Bridge.</span>
                </div>

                <div>
                    <h1>Be part of something meaningful.</h1>
                    <p>
                        Whether you want to donate surplus food or help
                        distribute it, your participation can make a real
                        difference in your community.
                    </p>
                </div>

                <div className="auth-quote">
                    Every meal shared is a step towards a better tomorrow.
                </div>
            </section>

            <section className="auth-form-side">
                <div className="auth-card">
                    <h2>Create your account</h2>
                    <p className="subtitle">
                        Join our community and help reduce food waste.
                    </p>

                    <div className="role-options">
                        <button
                            type="button"
                            className={`role-option ${role === "donor" ? "active" : ""}`}
                            onClick={() => setRole("donor")}
                        >
                            Food Donor
                        </button>

                        <button
                            type="button"
                            className={`role-option ${role === "ngo" ? "active" : ""}`}
                            onClick={() => setRole("ngo")}
                        >
                            NGO
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full name</label>
                            <input
                                className="form-control"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                                minLength="2"
                                maxLength="100"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                className="form-control"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone number</label>
                            <input
                                className="form-control"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="10-digit phone number"
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                maxLength="10"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <textarea
                                className="form-control"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Enter your address"
                                rows="2"
                                required
                                minLength="5"
                                maxLength="300"
                            />
                        </div>

                        {role === "ngo" && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Organization name</label>
                                    <input
                                        className="form-control"
                                        name="organizationName"
                                        value={form.organizationName}
                                        onChange={handleChange}
                                        placeholder="Enter NGO name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Registration number</label>
                                    <input
                                        className="form-control"
                                        name="registrationNumber"
                                        value={form.registrationNumber}
                                        onChange={handleChange}
                                        placeholder="Enter registration number"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-control"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a password (minimum 8 characters)"
                                minLength="8"
                                maxLength="100"
                                required
                            />
                        </div>

                        <button
                            className="primary-btn"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already registered? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Register;
