import {
  CheckCircle2,
  Clock3,
  Mail,
  Send,
  User,
  MessageSquare,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();

  const [scheduledCount, setScheduledCount] =
    useState(0);

  const [sentCount, setSentCount] =
    useState(0);

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [slackLoading, setSlackLoading] =
    useState(false);

  const [slackMessage, setSlackMessage] =
    useState("");

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isAuthenticated,
    navigate,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        const [
          scheduledResponse,
          sentResponse,
        ] = await Promise.all([
          api.get("/emails/scheduled"),
          api.get("/emails/sent"),
        ]);

        const scheduled =
          scheduledResponse.data.data || [];

        const sent =
          sentResponse.data.data || [];

        setScheduledCount(
          scheduled.length
        );

        setSentCount(sent.length);
      } catch (error) {
        console.error(
          "Failed to fetch dashboard stats:",
          error
        );
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const slackStatus =
      params.get("slack");

    if (slackStatus === "connected") {
      setSlackMessage(
        "Slack connected successfully."
      );
    }

    if (slackStatus === "denied") {
      setSlackMessage(
        "Slack connection was cancelled."
      );
    }

    if (slackStatus === "failed") {
      setSlackMessage(
        "Slack connection failed. Please try again."
      );
    }

    if (slackStatus) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  const handleConnectSlack = async () => {
    try {
      setSlackLoading(true);
      setSlackMessage("");

      const response = await api.get(
        "/slack/connect"
      );

      const authorizationUrl =
        response.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error(
          "Slack authorization URL was not returned"
        );
      }

      window.location.href =
        authorizationUrl;
    } catch (error) {
      console.error(
        "Failed to connect Slack:",
        error
      );

      setSlackMessage(
        "Unable to start Slack connection."
      );

      setSlackLoading(false);
    }
  };

  if (
    authLoading ||
    !isAuthenticated
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  const totalCount =
    scheduledCount + sentCount;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1">
        {/* Header */}
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Overview
            </h1>

            <p className="text-xs text-slate-500">
              Email scheduling workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-slate-500">
                {user?.email || ""}
              </p>
            </div>

            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
                <User className="h-4 w-4 text-slate-600" />
              </div>
            )}

            <Link
              to="/compose"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />

              <span className="hidden sm:inline">
                Compose Email
              </span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <section className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome back,{" "}
              {user?.name?.split(" ")[0] ||
                "there"}{" "}
              👋
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your email campaigns from
              one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Total */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Emails
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {statsLoading
                      ? "..."
                      : totalCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Mail className="h-5 w-5 text-slate-700" />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                All scheduled and processed
                emails
              </p>
            </div>

            {/* Scheduled */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Scheduled
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {statsLoading
                      ? "..."
                      : scheduledCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Clock3 className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <Link
                to="/scheduled"
                className="mt-4 inline-block text-xs font-semibold text-slate-700 hover:underline"
              >
                View scheduled emails →
              </Link>
            </div>

            {/* Sent */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Sent
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {statsLoading
                      ? "..."
                      : sentCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>

              <Link
                to="/sent"
                className="mt-4 inline-block text-xs font-semibold text-slate-700 hover:underline"
              >
                View sent emails →
              </Link>
            </div>
          </div>

          {/* Slack */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A154B]">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Slack Notifications
                    </h3>

                    <p className="text-sm text-slate-500">
                      Get notified when your hourly email limit is reached.
                    </p>
                  </div>
                </div>

                {slackMessage && (
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    {slackMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleConnectSlack}
                disabled={slackLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A154B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3b103c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {slackLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Connect Slack
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900">
                <Send className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Ready to schedule your
                emails?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload your recipient list,
                configure the sending delay and
                hourly limit, then let ReachInbox
                handle the scheduling.
              </p>

              <Link
                to="/compose"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Send className="h-4 w-4" />
                Compose New Email
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;