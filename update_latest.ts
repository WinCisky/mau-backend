import type PocketBase from "https://esm.sh/pocketbase@0.15.3";

import { decodeHTMLString } from "./helper.ts";
import { getAnimeImageMal } from "./helper_anime.ts";
const MY_URL = "https://www.animeunity.tv";

export async function updateLatest(pb: PocketBase) {
    const textResponse = await fetch(MY_URL);
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

                const malImage = await getAnimeImageMal(anime.mal_id);
                if (malImage) {
                    anime["imageurl"] = malImage;
                }

                let an;
                try {
                  an = await pb.collection('mau_anime').getFirstListItem(`mau_id="${anime.mau_id}"`);
                  await pb.collection('mau_anime').update(an.id, anime);
                } catch (_err){
                  an = await pb.collection('mau_anime').create(anime);
                }

                try {
                  // get first element with same anime_id and number
                  const ep = await pb.collection('mau_episodes').getFirstListItem(`anime_id="${episode.anime_id}" AND number="${episode.number}"`);
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