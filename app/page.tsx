import { cookies } from "next/headers";
import { Library } from "@/components/library";
import { listSessions, ownerHash } from "@/lib/db.server";
import { guestCookie } from "@/lib/http.server";
import { hostConfigured } from "@/lib/host.server";
export const dynamic = "force-dynamic";
export default async function Home() {
  const token = (await cookies()).get(guestCookie)?.value;
  const sessions =
    token && /^[a-f0-9]{64}$/.test(token) ? listSessions(ownerHash(token)) : [];
  return <Library sessions={sessions} available={hostConfigured()} />;
}
