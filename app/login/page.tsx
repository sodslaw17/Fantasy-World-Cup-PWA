import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in — WC26 Pool" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / wordmark */}
        <div className="text-center space-y-1">
          <div className="text-5xl font-black tracking-tight">
            <span className="text-gold">WC</span>
            <span className="text-paper">26</span>
          </div>
          <p className="text-xs text-paper/50 uppercase tracking-widest">
            Fantasy Pool
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
