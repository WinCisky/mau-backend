import type PocketBase from "https://esm.sh/pocketbase@0.15.3";

import { fillAnime } from "./helper_anime.ts";
const MY_URL = "https://www.animeunity.tv";

function getAnimeWithoutPastSeasons(pb: PocketBase) {
    return pb.collection('mau_anime').getFirstListItem(`past_seasons_checked=false`);
}

// meantto fill past seasons
export async function pastSeasons(pb: PocketBase) {
    // get anime to check (past_seasons_checked = false)
    const anime = await getAnimeWithoutPastSeasons(pb);
    const animeMauId = anime.mau_id;
    const animeSlug = anime.slug;
    const animeUrl = `${MY_URL}/anime/${animeMauId}-${animeSlug}`;
    // get website html
    const textResponse = await fetch(animeUrl);
    const textData = await textResponse.text();
    //  get related anime
    const regex = /related-item(?:\s+[^"]*)?">[\s\S]*?<a href="https:\/\/www.animeunity.to\/anime\/(\d+)-([^"]+)">/g;
    // all matches
    do {
        const match = regex.exec(textData);
        if (match && match.length > 1) {
            const anime = {
                "mau_id": parseInt(match[1]),
                "slug": match[2],
                "past_seasons_checked": false
            }
            await fillAnime(pb, anime.mau_id, anime.slug);
        }
    } while (regex.lastIndex > 0);

    // update past_seasons_checked = true
    const animeData = {
        "past_seasons_checked": true
    }
    try {
        const an = await pb.collection('mau_anime').getFirstListItem(`mau_id="${animeMauId}"`);
        await pb.collection('mau_anime').update(an.id, animeData);
        console.log(`updated past_seasons_checked: ${animeMauId}-${animeSlug}`);
    } catch (_err){
        console.log(`error updating past_seasons_checked: ${animeMauId}-${animeSlug}`);
    }
}