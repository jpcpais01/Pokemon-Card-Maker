import { Suspense } from "react";
import SoloPackRoute from "@/components/SoloPackRoute";

export default function ClassicPackPage() {
  return (
    <Suspense fallback={null}>
      <SoloPackRoute mode="classic" />
    </Suspense>
  );
}
