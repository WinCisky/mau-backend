import { Application, Router } from "https://deno.land/x/oak@v16.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import PocketBase from "https://esm.sh/pocketbase@0.26.0";
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
    const videoId = context?.params?.id ? parseInt(context?.params?.id) : null;
    if (!videoId || isNaN(videoId)) {
      context.response.status = 400; // Bad Request
      context.response.body = "Invalid video ID";
      return;
    }
    
    const range = context.request.headers.get("range");
    if (!range) {
      context.response.status = 416; // Range Not Satisfiable
      context.response.body = "Range header is required";
      return;
    }

    let videoUrl: string | undefined;

    const kv = await Deno.openKv();
    const cachedUrl = await kv.get(`video:${videoId}`);
    if (cachedUrl.value) {
      console.log(`Cache hit for video ID: ${videoId}`);
      videoUrl = cachedUrl.value;
    } else {
      console.log(`Cache miss for video ID: ${videoId}`);
      const result = await getVideoUrl(
        parseInt(context?.params?.id),
        context?.request.ip,
      );
      if (!result) {
        context.response.status = 404;
        context.response.body = "Video not found";
        return;
      }

      videoUrl = result;
      // cache for 30 minutes
      const expireIn = 60 * 60 * 1000; // 60 minutes in milliseconds
      await kv.set(`video:${videoId}`, videoUrl, { expireIn });
    }

    if (!videoUrl) {
      context.response.status = 404; // Not Found
      context.response.body = "Video URL not found";
      return;
    }

    const videoRequest = await fetch(videoUrl, {
      headers: {
        "Range": range,
      },
    });

    if (videoRequest.ok) {
      const readableStream = videoRequest.body;
      if (!readableStream) {
        context.response.status = 404;
        context.response.body = "Video not found";
        return;
      }

      const contentRange = videoRequest.headers.get("content-range");
      const contentLength = videoRequest.headers.get("content-length");

      context.response.status = 206; // Partial Content
      context.response.headers.set("content-type", "video/mp4");
      context.response.headers.set("content-range", contentRange || "");
      context.response.headers.set("content-length", contentLength || "");
      context.response.headers.set("accept-ranges", "bytes");

      context.response.body = readableStream;
    } else {
      context.response.status = 500;
      context.response.body = "Error fetching video";
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
