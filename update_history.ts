import type PocketBase from "https://esm.sh/pocketbase@0.15.3";

import { decodeHTMLString } from "./helper.ts";
const MY_URL = "https://www.animeunity.tv";

export async function updateHistory(pb: PocketBase) {
    const anime_list = await pb.collection('mau_anime').getList(1, 10, {
        sort: "updated",
    });

    anime_list.items.forEach(async (anime) => {
        await pb.collection('mau_anime').update(anime.id, anime);
        const mau_id = anime.mau_id;
        const anime_id = anime.id;
        const anime_slug = anime.slug;
        const textResponse = await fetch(`${MY_URL}/${mau_id}-${anime_slug}`);
        const textData = await textResponse.text();
        console.log(`${MY_URL}/${mau_id}-${anime_slug}`);

        const regex = /episodes="([^"]*)"/g;

        const match = regex.exec(textData);
        if (match && match.length > 1) {
            const decoded = JSON.parse(decodeHTMLString(match[1]));

            pb.autoCancellation(false);

            decoded.forEach(async (element : any) => {

                const episode = {
                    "mau_id": element.id,
                    "anime_id": element.anime_id,
                    "user_id": element.user_id,
                    "number": element.number,
                    "created_at": element.created_at,
                    "upload": element.created_at,
                    "link": element.link,
                    "visite": element.visite,
                    "hidden": element.hidden,
                    "public": element.public,
                    "scws_id": element.scws_id,
                    "file_name": element.file_name,
                    "tg_post": element.tg_post,
                    "anime": null as null | string,
                }

                //console.log(episode.mau_id);
                const filter = "mau_id=" + episode.mau_id;
                //console.log(filter);
                const ep = await pb.collection('mau_episodes').getList(1, 1, {
                    filter: filter,
                });
                if (ep.totalItems > 0) {
                    const ep_id = ep.items[0].id;
                    await pb.collection('mau_episodes').update(ep_id, episode);
                } else {
                    episode["anime"] = anime_id;
                    await pb.collection('mau_episodes').create(episode);
                }

            });
        }
    });
}