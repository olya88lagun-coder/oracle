import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardPreviewControls } from "@/components/lila/BoardPreviewControls";

export const metadata: Metadata = {
  title: "Dev preview: поле Лилы",
  robots: { index: false, follow: false },
};

export default function LilaBoardPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="page page--wide stack lila-preview-page">
      <BoardPreviewControls />
    </main>
  );
}
