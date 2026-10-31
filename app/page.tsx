"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/home"); }, [router]);
  return <a href="/home">前往主頁</a>;
}
