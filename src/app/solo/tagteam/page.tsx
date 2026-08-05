import { Suspense } from "react";
import SoloPackRoute from "@/components/SoloPackRoute";

export default function TagTeamPackPage() {
  return (
    <Suspense fallback={null}>
      <SoloPackRoute mode="tagteam" />
    </Suspense>
  );
}
