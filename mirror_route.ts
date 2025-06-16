import type { Context } from "https://deno.land/x/oak@v16.1.0/mod.ts";
import { getVideoUrl } from "./helper_mirror.ts";

export async function handleMirrorRoute(context: Context) {
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
  const cachedUrl = await kv.get(['video' , `${videoId}`]);
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
    await kv.set(['video', `${videoId}`], videoUrl, { expireIn });
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
}
