import type PocketBase from "https://esm.sh/pocketbase@0.15.3";

function getSeasonName() {
    const month = new Date().getMonth();
    if (month >= 0 && month < 3) return "winter";
    if (month >= 3 && month < 6) return "spring";
    if (month >= 6 && month < 9) return "summer";
    if (month >= 9 && month < 12) return "fall";
    return "winter";
}

function getSeasonIndex(season: string) {
    if (season == "winter") return 0;
    if (season == "spring") return 1;
    if (season == "summer") return 2;
    if (season == "fall") return 3;
    return 0;
}

export async function updateSeasonal(pb: PocketBase) {
    // get from mal
    // https://api.myanimelist.net/v2/anime/season/2023/fall?limit=100

    const year = new Date().getFullYear();
    const season = getSeasonName();
// console.log(`https://api.myanimelist.net/v2/anime/season/${year}/${season}?limit=100`);
    const resp = await fetch(`https://api.myanimelist.net/v2/anime/season/${year}/${season}?limit=100&sort=anime_score`, {
        headers: {
            "X-MAL-CLIENT-ID" : Deno.env.get("MAL_CLIENT_ID") ?? ""
        }
    });

    // console.log(resp);

    const mal = await resp.json();
    // console.log(mal);
    const data = mal.data;

    // save to db
    for (let i = 0; i < data.length; i++) {
        const anime_data = data[i].node;
        const anime = {} as any;
        anime["mal_id"] = anime_data.id;
        anime["title"] = anime_data.title;
        anime["img"] = anime_data.main_picture.large.replace(/\.[a-z]+$/, '.webp');
        anime["season"] = getSeasonIndex(season);
        anime["year"] = year;

        // console.log(anime);

        // check if there is already an anime with the same mal_id
        const filter = `mal_id=${anime.mal_id}`;
        const result = await pb.collection('mau_seasonal').getList(1, 1, {
            filter: filter,
        });
        if (result.totalItems > 0) {
            const id = result.items[0].id;
            await pb.collection('mau_seasonal').update(id, anime);
        } else {
            await pb.collection('mau_seasonal').create(anime);
        }
    }
}