import { getSessionUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /parent/settings/export — the family's data as a JSON download
 * (PRD P7). Runs as the signed-in member; the RPC exports only their own
 * family and never answer keys or other users' emails. Never cached.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store, private" };
  if (!(await getSessionUser()))
    return Response.json(
      { error: "not_authenticated" },
      { status: 401, headers },
    );
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("export_family_data");
  if (error)
    return Response.json({ error: "export_failed" }, { status: 500, headers });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="little-family-${day}.json"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
