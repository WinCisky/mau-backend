import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import PocketBase from "https://esm.sh/pocketbase@0.15.3";
import { dbAuth } from "./helper.ts";
import { getVideoUrl } from "./helper_mirror.ts";
import { updateLatest } from "./update_latest.ts";
import { pastSeasons } from "./past_seasons.ts";
import { load } from "https://deno.land/std/dotenv/mod.ts";
import { getRandom } from "./get_random.ts";
import { fillMissingDetails } from "./fill_missing_details.ts";

const env = await load();
if (env.ADMIN_EMAIL) {
  Deno.env.set("ADMIN_EMAIL", env.ADMIN_EMAIL);
}
if (env.ADMIN_PASSWORD) {
  Deno.env.set("ADMIN_PASSWORD", env.ADMIN_PASSWORD);
}
if (env.MAL_CLIENT_ID) {
  Deno.env.set("MAL_CLIENT_ID", env.MAL_CLIENT_ID);
}

const pb = new PocketBase("https://dev.opentrust.it/");

const router = new Router();
router
  // get video url
  .get("/api/mirror/:id", async (context) => {
    if (context?.params?.id) {
      context.response.headers.set("content-type", "application/json");
      context.response.headers.set("cache-control", "max-age=7200");
      const result = await getVideoUrl(
        parseInt(context?.params?.id),
        context?.request.ip,
      );
      context.response.body = JSON.stringify(result);
    }
  })
  // get latest episodes
  .get("/api/update-latest", async (context) => {
    dbAuth(pb);
    await updateLatest(pb);
    context.response.body = "Done!";
  })
  // get previuos seasons
  .get("/api/past-seasons", async (context) => {
    dbAuth(pb);
    await pastSeasons(pb);
    context.response.body = "Done!";
  })
  // get missing anime
  .get("/api/get-random", async (context) => {
    dbAuth(pb);
    await getRandom(pb);
    context.response.body = "Done!";
  })
  .get("/api/fill-missing-details", async (context) => {
    dbAuth(pb);
    await fillMissingDetails(pb);
    context.response.body = "Done!";
  });

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
