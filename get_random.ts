import type PocketBase from "https://esm.sh/pocketbase@0.22.0";
import { decodeHTMLString } from "./helper.ts";
import { fillAnime } from "./helper_anime.ts";

const RANDOM_URL = "https://www.animeunity.to/randomanime";

export async function getRandom(pb: PocketBase) {
    // get website html
    const textResponse = await fetch(RANDOM_URL);
    const textData = await textResponse.text();

    // get anime data
    const regex = /<video-player\sanime="(.*?)"/g;
    const match = regex.exec(textData);
    if (match && match.length > 1) {
        const parsedAnimeData = JSON.parse(decodeHTMLString(match[1]));
        
        const animeToFill = [
            {
                "mau_id": parsedAnimeData.id,
                "slug": parsedAnimeData.slug,
                "title_eng": parsedAnimeData.title_eng,
            }
        ];
        
        // add related anime
        for (let i = 0; i < parsedAnimeData.related.length; i++) {
            const anime = parsedAnimeData.related[i];
            animeToFill.push({
                "mau_id": anime.id,
                "slug": anime.slug,
                "title_eng": anime.title_eng,
            });
        }

        // fill anime
        for (let i = 0; i < animeToFill.length; i++) {
            const anime = animeToFill[i];
            await fillAnime(pb, anime.mau_id, anime.slug);
            console.log(`filled anime: ${anime.mau_id}-${anime.slug}: ${anime.title_eng}`);
        }
    }
}