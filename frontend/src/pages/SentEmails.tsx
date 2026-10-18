import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  Send,
  XCircle,
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
import type { Email } from "../types/email";
import Sidebar from "../components/Sidebar";

function SentEmails() {
  const navigate = useNavigate();

  const {
    loading: authLoading,
    isAuthenticated,
  } = useAuth();

  const [emails, setEmails] =
    useState<Email[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
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

    const fetchSentEmails =
      async () => {
        try {
          setLoading(true);

          const response =
            await api.get(
              "/emails/sent"
            );

          setEmails(
            response.data.data || []
          );
        } catch (error) {
          console.error(
            "Failed to fetch sent emails:",
            error
          );
        } finally {
          setLoading(false);
        }
      };

    fetchSentEmails();
  }, [isAuthenticated]);

  const filteredEmails =
    emails.filter((email) => {
      const query =
        search.toLowerCase();

      return (
        email.recipientEmail
          .toLowerCase()
          .includes(query) ||
        email.subject
          .toLowerCase()
          .includes(query)
      );
    });

  const formatDate = (
    value: string | null | undefined
  ) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  if (
    authLoading ||
    !isAuthenticated
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Sent Emails
              </h1>

              <p className="text-xs text-slate-500">
                Email delivery history
              </p>
            </div>
          </div>

          <Link
            to="/compose"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Send className="h-4 w-4" />

            <span className="hidden sm:inline">
              Compose
            </span>
          </Link>
        </header>

        <section className="p-6">
          {/* Heading */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-slate-700" />

                <span className="text-sm font-medium text-slate-500">
                  {emails.length} processed
                  email
                  {emails.length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Email history
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View successfully sent and
                failed emails.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search emails..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-700" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading sent emails...
                  </p>
                </div>
              </div>
            ) : filteredEmails.length ===
              0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Send className="h-5 w-5 text-slate-500" />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {search
                    ? "No emails found"
                    : "No sent emails"}
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {search
                    ? "Try another email address or subject."
                    : "Processed emails will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Recipient
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subject
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Sent Time
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEmails.map(
                      (email) => {
                        const isSent =
                          email.status ===
                          "SENT";

                        return (
                          <tr
                            key={email.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">
                                {
                                  email.recipientEmail
                                }
                              </p>
                            </td>

                            <td className="max-w-xs px-6 py-4">
                              <p className="truncate text-sm text-slate-700">
                                {
                                  email.subject
                                }
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600">
                                {formatDate(
                                  email.sentAt
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              {isSent ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Failed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default SentEmails;