import type PocketBase from "https://esm.sh/pocketbase@0.15.3";

import { decodeHTMLString } from "./helper.ts";
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

                if (!anime.mal_id){
                    // do not update mal_id
                    delete anime.mal_id;
                    //if forbidden image do not update it
                    if (anime.imageurl.includes("forbiddenlol"))
                        delete anime.imageurl;
                } else {
                    //// unofficial api
                    //const resp = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/full`);
                    //const mal = await resp.json();
                    //if (mal.data)
                    //    anime["imageurl"] = mal.data.images.webp["large_image_url"];
                    
                    // official api
                    const resp = await fetch(`https://api.myanimelist.net/v2/anime/${anime.mal_id}?fields=main_picture`, {
                        headers: {
                            "X-MAL-CLIENT-ID" : Deno.env.get("MAL_CLIENT_ID") ?? ""
                        }
                    });
                    const mal = await resp.json();
                    console.log(mal.main_picture.large);
                    //console.log(mal);
                    if (mal && mal.main_picture && mal.main_picture.large)
                        anime["imageurl"] = mal.main_picture.large.replace(/\.[a-z]+$/, '.webp');;
                }

                let an;
                try {
                  an = await pb.collection('mau_anime').getFirstListItem(`mau_id="${anime.mau_id}"`);
                  await pb.collection('mau_anime').update(an.id, anime);
                } catch (_err){
                  an = await pb.collection('mau_anime').create(anime);
                }

                try {
                  const ep = await pb.collection('mau_episodes').getFirstListItem(`mau_id="${episode.mau_id}"`);
                  await pb.collection('mau_episodes').update(ep.id, episode);
                } catch (_err){
                  episode["anime" as keyof typeof episode] = an.id;
                  await pb.collection('mau_episodes').create(episode);
                }
            }
        }
    }
}