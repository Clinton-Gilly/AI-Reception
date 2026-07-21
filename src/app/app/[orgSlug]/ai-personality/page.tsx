import { auth } from "@clerk/nextjs/server";
import { AiPersonalityScreen } from "@/components/dashboard/ai-personality-screen";

export default async function AiPersonalityPage() {
  await auth.protect();
  return <AiPersonalityScreen />;
}
