import { Suspense } from "react";
import SoloPackRoute from "@/components/SoloPackRoute";

export default function TripleTagTeamSirPackPage() {
  return (
    <Suspense fallback={null}>
      <SoloPackRoute mode="tripletagteamsir" />
    </Suspense>
  );
}
