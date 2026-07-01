"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loginAction(new FormData(e.currentTarget));
    setLoading(false);
    if (res.ok) router.refresh();
    else setError(res.error ?? "خطأ");
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-24" dir="rtl">
      <h1 className="text-center font-display text-2xl text-plum">لوحة التحكم</h1>
      <p className="mt-2 text-center text-sm text-muted">
        أدخل كلمة المرور للمتابعة
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          name="password"
          type="password"
          autoFocus
          placeholder="كلمة المرور"
          className="rounded-full border border-line bg-seashell px-5 py-2.5 text-ink outline-none focus:border-mauve"
        />
        <button
          disabled={loading}
          className="rounded-full bg-mauve px-6 py-2.5 font-medium text-parchment transition hover:bg-mauve-dark disabled:opacity-60"
        >
          {loading ? "…" : "دخول"}
        </button>
        {error && <p className="text-center text-sm text-red-700">{error}</p>}
      </form>
    </div>
  );
}
