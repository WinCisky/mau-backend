import type PocketBase from "https://esm.sh/pocketbase@0.22.0";

import { fillAnime } from "./helper_anime.ts";
const MY_URL = "https://www.animeunity.tv";

async function getAnimeWithoutPastSeasons(pb: PocketBase) {
    let anime = null;
    try {
        anime = await pb.collection('mau_anime').getFirstListItem(`past_seasons_checked=false`);
    } catch (_err) {
        console.log("no anime without past seasons");
    }

    return anime;
}

// meantto fill past seasons
export async function pastSeasons(pb: PocketBase) {
    // get anime to check (past_seasons_checked = false)
    const anime = await getAnimeWithoutPastSeasons(pb);
    if (!anime) {
        console.log("Done!");
        return;
    } else {
        console.log(`filling past seasons for: ${anime.mau_id}-${anime.slug}`);
    }
    const animeMauId = anime.mau_id;
    const animeSlug = anime.slug;
    const animeUrl = `${MY_URL}/anime/${animeMauId}-${animeSlug}`;
    // get website html
    const textResponse = await fetch(animeUrl);
    const textData = await textResponse.text();
    //  get related anime
    const regex = /related-item(?:\s+[^"]*)?">[\s\S]*?<a href="https:\/\/www.animeunity.so\/anime\/(\d+)-([^"]+)">/g;
    // all matches
    do {
        const match = regex.exec(textData);
        if (match && match.length > 1) {
            const anime = {
                "mau_id": parseInt(match[1]),
                "slug": match[2]
            }
            await fillAnime(pb, anime.mau_id, anime.slug);
        }
    } while (regex.lastIndex > 0);

    // update past_seasons_checked = true
    const animeData = {
        "past_seasons_checked": true
    }
    try {
        await pb.collection('mau_anime').update(anime.id, animeData);
        console.log(`updated past_seasons_checked: ${animeMauId}-${animeSlug}`);
    } catch (_err){
        console.log(`error updating past_seasons_checked: ${animeMauId}-${animeSlug}`);
    }
}