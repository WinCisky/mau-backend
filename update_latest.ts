import type PocketBase from "https://esm.sh/pocketbase@0.22.0";

import { decodeHTMLString } from "./helper.ts";
import { getAnimeDetailsMalApi, getAnimeDetailsMalJikanMoeApi } from "./helper_anime.ts";
const MY_URL = "https://www.animeunity.to";

export async function updateLatest(pb: PocketBase) {
    const textResponse = await fetch(MY_URL, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "Referer": "https://www.animeunity.so/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    });
    const textData = await textResponse.text();

    const regex = /<layout-items\s+items-json="(.*?)"/g;

    const match = regex.exec(textData);
    if (match && match.length > 1) {

        const parsed = JSON.parse(decodeHTMLString(match[1]));
        const data = parsed.data;

        if (data) {
            for (let i = 0; i < data.length; i++) {

                const anime = data[i].anime;
                // console.log(anime);
                anime["mau_id"] = anime.id;
                delete anime.id;
                const episode = {
                    "mau_id": data[i].id,
                    "anime_id": data[i].anime_id,
                    "user_id": data[i].user_id,
                    "number": data[i].number,
                    "created_at": data[i].created_at,
                    "upload": data[i].created_at,
                    "link": data[i].link,
                    "visite": data[i].visite,
                    "hidden": data[i].hidden,
                    "public": data[i].public,
                    "scws_id": data[i].scws_id,
                    "file_name": data[i].file_name,
                    "tg_post": data[i].tg_post
                }

                const malApiDetails = await getAnimeDetailsMalApi(anime.mal_id, ["main_picture", "nsfw", "rating"]);
                if (malApiDetails) {
                  if (malApiDetails.main_picture && malApiDetails.main_picture.large) {
                    anime["imageurl"] = malApiDetails.main_picture.large.replace(/\.[a-z]+$/, '.webp');
                  }
                  if (malApiDetails.nsfw) {
                    anime["nsfw"] = malApiDetails.nsfw;
                  }
                  if (malApiDetails.rating) {
                    anime["rating"] = malApiDetails.rating;
                  }
                }

                let an;
                try {
                  an = await pb.collection('mau_anime').getFirstListItem(`mau_id="${anime.mau_id}"`);
                  await pb.collection('mau_anime').update(an.id, anime);
                } catch (_err){
                  const malJikanMoeApiDetails = await getAnimeDetailsMalJikanMoeApi(anime.mal_id);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s
                  if (malJikanMoeApiDetails) {
                    const video_id = malJikanMoeApiDetails.data?.trailer?.youtube_id ?? "-";
                    anime["video"] = video_id;
                  }
                  an = await pb.collection('mau_anime').create(anime);
                }

                try {
                  // get first element with same anime_id and number
                  const ep = await pb.collection('mau_episodes').getFirstListItem(`anime.mau_id="${episode.anime_id}" && number="${episode.number}"`);
                  // const ep = await pb.collection('mau_episodes').getFirstListItem(`mau_id="${episode.mau_id}"`);
                  await pb.collection('mau_episodes').update(ep.id, episode);
                } catch (_err){
                  episode["anime" as keyof typeof episode] = an.id;
                  await pb.collection('mau_episodes').create(episode);
                }
            }
        }
    }
}
