import PocketBase from "https://esm.sh/pocketbase@0.15.3";
import { getAnimeDetailsMalApi } from "./helper_anime.ts";

export async function fillMissingDetails(pb: PocketBase) {
    const anime = await pb.collection('mau_anime').getList(1, 1000, {
        filter: 'nsfw = null'
    });
    for (const item of anime.items) {
        const mal_id = item.mal_id;
        const malApiDetails = await getAnimeDetailsMalApi(mal_id, ["nsfw", "rating"]);
        if (malApiDetails) {
            const animeData = {
                "nsfw": null,
                "rating": null
            };
            if (malApiDetails.nsfw) {
                animeData["nsfw"] = malApiDetails.nsfw;
            }
            if (malApiDetails.rating) {
                animeData["rating"] = malApiDetails.rating;
            }
            try {
                await pb.collection('mau_anime').update(item.id, animeData);
                console.log(`updated nsfw and rating: ${mal_id}`);
            } catch (_err){
                console.log(`error updating nsfw and rating: ${mal_id}`);
            }
        }
        // wait 3-30s randomly
        const waitTime = Math.floor(Math.random() * 30) + 3;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
    // console.log(anime);
    console.log("Done!");
}