import { Suspense } from "react";
import SoloPackRoute from "@/components/SoloPackRoute";

export default function SirPackPage() {
  return (
    <Suspense fallback={null}>
      <SoloPackRoute mode="sir" />
    </Suspense>
  );
}
