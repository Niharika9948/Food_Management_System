
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const loggedInUser = await login(form.email, form.password);

            if (loggedInUser.role === "donor") {
                navigate("/donor/dashboard");
            } else if (loggedInUser.role === "ngo") {
                navigate("/ngo/dashboard");
            } else if (loggedInUser.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                setError("Your account has an unsupported role.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to log in. Please try again."
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
                    <h1>Good food deserves a second chance.</h1>
                    <p>
                        Connect people who have extra food with organizations
                        that can deliver it to those who need it. Together,
                        we can reduce food waste and fight hunger.
                    </p>
                </div>

                <div className="auth-quote">
                    Share more. Waste less. Make a difference.
                </div>
            </section>

            <section className="auth-form-side">
                <div className="auth-card">
                    <h2>Welcome back!</h2>
                    <p className="subtitle">
                        Sign in to continue to your FoodBridge account.
                    </p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                className="form-control"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-control"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            className="primary-btn"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Create account</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Login;
