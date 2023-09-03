import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import PocketBase from "https://esm.sh/pocketbase@0.15.3";
import { getVideoUrl } from "./helper_mirror.ts";
import { decodeHTMLString } from "./helper.ts";

const MY_URL = "https://www.animeunity.tv";
const pb = new PocketBase("https://dev.opentrust.it/");

const router = new Router();
router
  .get("/api/mirror/:id", async (context) => {
    if (context?.params?.id) {
      // console.log(context?.request.headers.get("x-forwarded-for"));
      context.response.headers.set("content-type", "application/json");
      context.response.headers.set("cache-control", "max-age=7200");
      const result = await getVideoUrl(parseInt(context?.params?.id), context?.request.headers.get("x-forwarded-for"));
      context.response.body = JSON.stringify(result);
    }
  })
  .get("/api/update-latest", (context) => {
    context.response.body = "Hello!";
  })
  .get("/api/update-history", (context) => {
    context.response.body = "Hello!";
  });

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
