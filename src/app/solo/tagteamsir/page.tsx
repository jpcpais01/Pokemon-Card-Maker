import { Suspense } from "react";
import SoloPackRoute from "@/components/SoloPackRoute";

export default function TagTeamSirPackPage() {
  return (
    <Suspense fallback={null}>
      <SoloPackRoute mode="tagteamsir" />
    </Suspense>
  );
}
