import type PocketBase from "https://esm.sh/pocketbase@0.15.3";
import { decodeHTMLString } from "./helper.ts";

export async function getAnimeImageMal(mal_id: number) {
    //// unofficial api
    //const resp = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/full`);
    //const mal = await resp.json();
    //if (mal.data)
    //    anime["imageurl"] = mal.data.images.webp["large_image_url"];

    // official api
    const resp = await fetch(`https://api.myanimelist.net/v2/anime/${mal_id}?fields=main_picture`, {
        headers: {
            "X-MAL-CLIENT-ID" : Deno.env.get("MAL_CLIENT_ID") ?? ""
        }
    });
    const mal = await resp.json();
    // console.log(mal.main_picture.large);
    //console.log(mal);
    if (mal && mal.main_picture && mal.main_picture.large) {
        return mal.main_picture.large.replace(/\.[a-z]+$/, '.webp');
    }
    return null;
}

export async function fillAnime(pb: PocketBase, mal_id: number, slug: string) {
    // console.log(`fillAnime: ${mal_id}-${slug}`);
    const animeUrl = `https://www.animeunity.to/anime/${mal_id}-${slug}`;
    const textResponse = await fetch(animeUrl);
    const textData = await textResponse.text();

    const regex = /<video-player\sanime="(.*?)"[\s\S]*?episodes="(.*?)"/g;

    const match = regex.exec(textData);
    if (match && match.length > 1) {

        const parsedAnimeData = JSON.parse(decodeHTMLString(match[1]));
        const parsedEpisodesData = JSON.parse(decodeHTMLString(match[2]));

        const savedAnime = await saveAnime(pb, parsedAnimeData);
        await saveAnimePastSeasonsAssociation(pb, parsedAnimeData.related);
        await saveEpisodes(pb, savedAnime, parsedEpisodesData);
    }
}

async function saveAnimePastSeasonsAssociation(pb: PocketBase, related: any) {
    let found = false;
    let association = null;
    const animeIds = [];
    // console.log(`related: ${related.length}`);
    // for every anime in related check if there is an association with the current anime
    for (let i = 0; i < related.length; i++) {
        const anime = related[i];
        try {
            const animeId = await pb.collection('mau_anime').getFirstListItem(`mau_id="${anime.id}"`);
            animeIds.push(animeId.id);

            // check if the association already exists
            association = await pb.collection('mau_related').getFirstListItem(`seasons.mau_id?="${anime.id}"`);

            found = true;
        } catch (_err) {
            // do nothing
        }
    }

    if (!found) {
        // create the association
        const related = {
            "seasons": animeIds
        }
        await pb.collection('mau_related').create(related);
        // console.log(`created association: ${animeIds}`);
    } else if (association) {
        // update the association
        const related = {
            "seasons": animeIds
        }
        await pb.collection('mau_related').update(association.id, related);
        // console.log(`updated association: ${animeIds}`);
    }
}

export async function saveAnime(pb: PocketBase, anime: any) {
    const animeData = {
        "mau_id": anime.id,
        "user_id": anime.user_id,
        "title": anime.title,
        "imageurl": anime.imageurl,
        "plot": anime.plot,
        "date": anime.date,
        "episodes_count": anime.episodes_count,
        "episodes_length": anime.episodes_length,
        "author": anime.author,
        "status": anime.status,
        "imageurl_cover": anime.imageurl_cover,
        "type": anime.type,
        "slug": anime.slug,
        "title_eng": anime.title_eng,
        "day": anime.day,
        "favorites": anime.favorites,
        "score": anime.score,
        "visite": anime.visite,
        "studio": anime.studio,
        "dub": anime.dub,
        "always_home": anime.always_home,
        "members": anime.members,
        "cover": anime.cover,
        "anilist_id": anime.anilist_id,
        "season": anime.season,
        "title_it": anime.title_it,
        "mal_id": anime.mal_id,
        "past_seasons_checked": true
    }

    const malImage = await getAnimeImageMal(anime.mal_id);
    if (malImage) {
        animeData["imageurl"] = malImage;
        // console.log(`updated imageurl: ${animeData.mau_id}-${animeData.slug}`);
    }

    let an;
    try {
        an = await pb.collection('mau_anime').getFirstListItem(`mau_id="${animeData.mau_id}"`);
        await pb.collection('mau_anime').update(an.id, animeData);
        // console.log(`updated anime: ${animeData.mau_id}-${animeData.slug}`);
    } catch (_err) {
        an = await pb.collection('mau_anime').create(animeData);
        // console.log(`created anime: ${animeData.mau_id}-${animeData.slug}`);
    }

    return an.id ?? null;
}

export async function saveEpisodes(pb: PocketBase, anime_id: string | null, episodes: any) {
    for (let i = 0; i < episodes.length; i++) {
        const episodeData = {
            "mau_id": episodes[i].id,
            "anime_id": anime_id,
            "user_id": episodes[i].user_id,
            "number": episodes[i].number,
            "created_at": episodes[i].created_at,
            "upload": episodes[i].created_at,
            "link": episodes[i].link,
            "visite": episodes[i].visite,
            "hidden": episodes[i].hidden,
            "public": episodes[i].public,
            "scws_id": episodes[i].scws_id,
            "file_name": episodes[i].file_name,
            "tg_post": episodes[i].tg_post
        }

        let ep;
        try {
            ep = await pb.collection('mau_episodes').getFirstListItem(`mau_id="${episodeData.mau_id}"`);
            await pb.collection('mau_episodes').update(ep.id, episodeData);
            // console.log(`updated episode: ${episodeData.mau_id}-${episodeData.number}`);
        } catch (_err) {
            if (!anime_id) return;
            episodeData["anime" as keyof typeof episodeData] = anime_id;
            ep = await pb.collection('mau_episodes').create(episodeData);
            // console.log(`created episode: ${episodeData.mau_id}-${episodeData.number}`);
        }
    }
}