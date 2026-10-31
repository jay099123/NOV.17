import MemoryPlayer from "@/components/memory-player";

export default function ExperienceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Keep music and interaction state mounted across /home, /intro and /memo.
  return <><MemoryPlayer />{children}</>;
}
