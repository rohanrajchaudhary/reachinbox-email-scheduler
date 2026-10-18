// import { FormEvent, useState } from "react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Clock3,
  FileText,
  Mail,
  Send,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";

function ComposeEmail() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emails, setEmails] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [startTime, setStartTime] = useState("");
  const [delay, setDelay] = useState("5");
  const [hourlyLimit, setHourlyLimit] = useState("100");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0] || null;

    setFile(selectedFile);
  };

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("startTime", startTime);
      formData.append(
        "delayBetweenEmails",
        delay
      );
      formData.append(
        "hourlyLimit",
        hourlyLimit
      );

      if (file) {
        formData.append("file", file);
      } else {
        formData.append("emails", emails);
      }

      const response = await api.post(
        "/emails/schedule",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/scheduled");
      }, 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to schedule emails"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Compose New Email
            </h1>

            <p className="text-xs text-slate-500">
              Create and schedule your email campaign
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Mail className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Email Content
                </h2>

                <p className="text-sm text-slate-500">
                  Write the message you want to send.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
                  placeholder="Enter email subject"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Body
                </label>

                <textarea
                  value={body}
                  onChange={(e) =>
                    setBody(e.target.value)
                  }
                  placeholder="Write your email..."
                  required
                  rows={8}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Upload className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Recipients
                </h2>

                <p className="text-sm text-slate-500">
                  Upload a CSV/text file or enter emails manually.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 transition hover:border-slate-500 hover:bg-slate-50">
              <FileText className="h-8 w-8 text-slate-400" />

              <span className="mt-3 text-sm font-medium text-slate-700">
                {file
                  ? file.name
                  : "Choose recipient file"}
              </span>

              <span className="mt-1 text-xs text-slate-400">
                CSV or TXT up to 5 MB
              </span>

              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <textarea
              value={emails}
              onChange={(e) =>
                setEmails(e.target.value)
              }
              placeholder={
                "Enter emails separated by comma or newline\nexample@gmail.com\nuser@example.com"
              }
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Clock3 className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Scheduling
                </h2>

                <p className="text-sm text-slate-500">
                  Configure when and how fast emails are sent.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Start Time
                </label>

                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Delay Between Emails
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={delay}
                    onChange={(e) =>
                      setDelay(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-16 outline-none focus:border-slate-900"
                  />

                  <span className="absolute right-4 top-3.5 text-sm text-slate-400">
                    sec
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hourly Limit
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={hourlyLimit}
                    onChange={(e) =>
                      setHourlyLimit(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none focus:border-slate-900"
                  />

                  <span className="absolute right-4 top-3.5 text-sm text-slate-400">
                    / hour
                  </span>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />

              {loading
                ? "Scheduling..."
                : "Schedule Emails"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ComposeEmail;