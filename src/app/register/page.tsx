import { AuthForm } from "@/components/auth-form";
import { BrandMark, Card, Shell } from "@/components/ui";

export default function RegisterPage() {
  return (
    <Shell>
      <main className="grid min-h-screen place-items-center px-4 py-10">
        <Card className="w-full max-w-md">
          <BrandMark />
          <h1 className="mt-8 text-3xl font-black tracking-tight">Create your Querynest account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Start SQL from zero, enroll in courses, save progress, earn points, and climb the leaderboard.</p>
          <div className="mt-6"><AuthForm mode="register" /></div>
        </Card>
      </main>
    </Shell>
  );
}
