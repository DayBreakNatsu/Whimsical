/* eslint-disable no-undef */
import { createClient } from "@supabase/supabase-js";

// Configuration via environment variables
// Provide either SUPABASE_URL or PROJECT_REF (will be converted to URL)
const PROJECT_REF = process.env.PROJECT_REF;
const SUPABASE_URL = process.env.SUPABASE_URL || (PROJECT_REF ? `https://${PROJECT_REF}.supabase.co` : undefined);
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Set SUPABASE_URL or PROJECT_REF in environment");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY in environment (Service Role key)");
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@whimsical.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Achlys2025!";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    const lastPage = typeof data?.lastPage === "number" ? data.lastPage : page;
    if (page >= lastPage) break;
    page += 1;
  }
  return null;
}

async function createOrUpdateAdmin() {
  console.log(`Using project: ${SUPABASE_URL}`);
  console.log(`Ensuring admin user exists: ${ADMIN_EMAIL}`);

  const existing = await findUserByEmail(ADMIN_EMAIL);

  if (!existing) {
    console.log("No existing admin found. Creating...");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "admin", name: "Admin" },
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log("Created admin user:", data.user?.id || data);
    return data;
  } else {
    console.log(`Admin user exists (${existing.id}). Updating password and metadata...`);
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "admin", name: "Admin" },
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log("Updated admin user:", existing.id);
    return data;
  }
}

createOrUpdateAdmin()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err?.message || err);
    process.exit(1);
  });
