import { notFound, redirect } from "next/navigation";
import { Investigation } from "@/components/investigation";
import { owner } from "@/lib/http.server";
import { readSession, view, GameError } from "@/lib/db.server";
export const dynamic = "force-dynamic";
export default async function Play({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let guest: string;
  try {
    guest = await owner();
  } catch {
    redirect("/");
  }
  let session;
  try {
    session = view(readSession((await params).id, guest));
  } catch (e) {
    if (e instanceof GameError && e.status === 404) notFound();
    throw e;
  }
  return <Investigation key={session.id} initial={session} />;
}
