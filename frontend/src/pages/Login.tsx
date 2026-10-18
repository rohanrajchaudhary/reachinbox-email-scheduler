import { Mail, ShieldCheck } from "lucide-react";

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function Login() {
  const handleGoogleLogin = () => {
    window.location.href =
      `${BACKEND_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <Mail className="h-7 w-7 text-slate-900" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            ReachInbox
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Smart email scheduling platform
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-white p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your scheduled emails.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
              />
              <path
                fill="#34A853"
                d="M12 21.99c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.99Z"
              />
              <path
                fill="#FBBC05"
                d="M6.54 14.07a5.86 5.86 0 0 1 0-3.75V7.79H3.29a9.74 9.74 0 0 0 0 8.81l3.25-2.53Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.29c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.35 14.63 2.48 12 2.48a9.74 9.74 0 0 0-8.71 5.31l3.25 2.53C7.31 8.01 9.46 6.29 12 6.29Z"
              />
            </svg>

            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              SECURE LOGIN
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="text-xs leading-5 text-slate-500">
              Your account is protected using Google
              OAuth authentication.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          ReachInbox Email Scheduler
        </p>
      </div>
    </div>
  );
}

export default Login;