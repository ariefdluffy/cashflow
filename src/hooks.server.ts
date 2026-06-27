import "dotenv/config";
import { setupDriveWatch } from "$lib/server/drive-watch";
import { env } from "$env/dynamic/private";
import { verifySessionToken } from "$lib/server/auth";
import { redirect, type Handle } from "@sveltejs/kit";

export async function init() {
  const webhookUrl = env.GOOGLE_DRIVE_WEBHOOK_URL;

  if (webhookUrl) {
    console.log("[Hooks] Setting up Drive watch →", webhookUrl);
    await setupDriveWatch(webhookUrl);
  } else {
    console.log(
      "[Hooks] GOOGLE_DRIVE_WEBHOOK_URL not set — using polling fallback (30s)",
    );
  }
}

const PUBLIC_PATHS = new Set(["/login", "/api/login", "/logout"]);

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("session") ?? "";
  const user = token ? verifySessionToken(token) : null;
  event.locals.user = user;

  const isPublic = PUBLIC_PATHS.has(event.url.pathname);

  if (!user && !isPublic) {
    throw redirect(303, "/login");
  }

  if (
    user &&
    event.url.pathname === "/login" &&
    event.request.method === "GET"
  ) {
    throw redirect(303, "/");
  }

  return resolve(event);
};
