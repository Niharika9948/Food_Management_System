import { useEffect, useState } from "react";
import {
  Package,
  CheckCircle,
  Clock,
  Utensils,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  HeartHandshake
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import API from "../../services/api";
import "./NGODashboard.css";

const extractList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.donations)) return data.donations;
  if (Array.isArray(data?.data?.donations)) return data.data.donations;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const formatDate = (value) => {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const NGODashboard = () => {
  const navigate = useNavigate();

  const [availableDonations, setAvailableDonations] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [availableResponse, collectionsResponse] = await Promise.all([
        API.get("/donations/available"),
        API.get("/ngo/my-donations")
      ]);

      setAvailableDonations(extractList(availableResponse));
      setMyCollections(extractList(collectionsResponse));
    } catch (err) {
      console.error("NGO dashboard error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load NGO dashboard information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const completedCount = myCollections.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const acceptedCount = myCollections.filter(
    (item) => item.status === "ACCEPTED" || item.status === "PICKED_UP"
  ).length;

  return (
    <DashboardLayout role="ngo">
      <div className="ngo-dashboard">

        <section className="ngo-welcome">
          <div>
            <span className="ngo-eyebrow">NGO WORKSPACE</span>
            <h1>Welcome to FoodBridge!</h1>
            <p>
              Discover available food donations and make a difference
              in your community.
            </p>

            <button
              className="ngo-primary-btn"
              onClick={() => navigate("/ngo/donations")}
            >
              Explore Donations
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="ngo-welcome-icon">
            <HeartHandshake size={90} strokeWidth={1.3} />
          </div>
        </section>

        <section className="ngo-stats-grid">

          <div className="ngo-stat-card">
            <div className="ngo-stat-icon green">
              <Package size={23} />
            </div>
            <div>
              <span>Available Donations</span>
              <strong>
                {loading ? "—" : availableDonations.length}
              </strong>
              <small>Ready for collection</small>
            </div>
          </div>

          <div className="ngo-stat-card">
            <div className="ngo-stat-icon blue">
              <Clock size={23} />
            </div>
            <div>
              <span>Active Collections</span>
              <strong>{loading ? "—" : acceptedCount}</strong>
              <small>Accepted or picked up</small>
            </div>
          </div>

          <div className="ngo-stat-card">
            <div className="ngo-stat-icon purple">
              <CheckCircle size={23} />
            </div>
            <div>
              <span>Completed Collections</span>
              <strong>{loading ? "—" : completedCount}</strong>
              <small>Successfully completed</small>
            </div>
          </div>

          <div className="ngo-stat-card">
            <div className="ngo-stat-icon orange">
              <Utensils size={23} />
            </div>
            <div>
              <span>Total Collections</span>
              <strong>{loading ? "—" : myCollections.length}</strong>
              <small>Your collection history</small>
            </div>
          </div>

        </section>

        <section className="ngo-dashboard-content">

          <div className="ngo-section-heading">
            <div>
              <h2>Available Food Donations</h2>
              <p>Recently listed food donations waiting for collection</p>
            </div>

            <button
              className="ngo-refresh-btn"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="ngo-dashboard-state">
              <div className="ngo-loader" />
              <p>Loading dashboard...</p>
            </div>
          ) : error ? (
            <div className="ngo-dashboard-state error">
              <AlertCircle size={35} />
              <h3>Unable to load dashboard</h3>
              <p>{error}</p>
              <button onClick={fetchDashboardData}>Try Again</button>
            </div>
          ) : availableDonations.length === 0 ? (
            <div className="ngo-dashboard-state">
              <Package size={40} />
              <h3>No available donations</h3>
              <p>New food donations will appear here when donors list them.</p>
            </div>
          ) : (
            <div className="ngo-donation-grid">
              {availableDonations.slice(0, 6).map((donation) => (
                <article
                  className="ngo-donation-card"
                  key={donation._id || donation.id}
                >
                  <div className="ngo-donation-image">
                    {donation.imageUrl ? (
                      <img
                        src={donation.imageUrl}
                        alt={donation.foodName || "Food"}
                      />
                    ) : (
                      <Utensils size={35} />
                    )}

                    <span>AVAILABLE</span>
                  </div>

                  <div className="ngo-donation-body">
                    <span className="ngo-food-category">
                      {donation.category || "Food"}
                    </span>

                    <h3>{donation.foodName || "Food Donation"}</h3>

                    <div className="ngo-donation-info">
                      <span>
                        <Package size={15} />
                        {donation.quantity ?? "—"} {donation.unit || ""}
                      </span>

                      <span>
                        <MapPin size={15} />
                        {donation.address || "Address not provided"}
                      </span>

                      <span>
                        <Clock size={15} />
                        Expires: {formatDate(donation.expiryTime)}
                      </span>
                    </div>

                    <button
                      className="ngo-view-btn"
                      onClick={() =>
                        navigate(`/ngo/donations/${donation._id || donation.id}`)
                      }
                    >
                      View Donation
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && availableDonations.length > 6 && (
            <button
              className="ngo-see-all-btn"
              onClick={() => navigate("/ngo/donations")}
            >
              View All Available Donations
              <ArrowRight size={17} />
            </button>
          )}

        </section>

        <section className="ngo-impact-banner">
          <div>
            <HeartHandshake size={32} />
          </div>
          <section>
            <h3>Every meal shared creates an impact.</h3>
            <p>
              Your work helps reduce food waste and brings support
              to people who need it.
            </p>
          </section>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default NGODashboard;