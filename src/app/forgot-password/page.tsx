import Link from "next/link";
import { BrandMark, Card, Shell } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <Shell>
      <main className="grid min-h-screen place-items-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <div className="flex justify-center"><BrandMark /></div>
          <h1 className="mt-8 text-3xl font-black tracking-tight">Password reset</h1>
          <p className="mt-3 leading-7 text-slate-600">For this MVP, password reset is designed into the authentication flow and can be connected to an email provider later. Contact the instructor or use the demo credentials on the login page.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">Back to login</Link>
        </Card>
      </main>
    </Shell>
  );
}
