import PocketBase from "https://esm.sh/pocketbase@0.15.3";

export async function fillMissingDetails(pb: PocketBase) {
    const anime = await pb.collection('mau_anime').getList(1, 200, {
        filter: 'video = null'
    });
    for (const item of anime.items) {
        const mal_id = item.mal_id;
        // https://api.jikan.moe/v4/anime/${id}/videos
        const resp = await fetch(`https://api.jikan.moe/v4/anime/${mal_id}/full`);
        const mal = await resp.json();
        const video_id = mal?.data?.trailer?.youtube_id ?? "-";
        // set video of anime
        const animeData = {
            "video": video_id
        }
        try {
            await pb.collection('mau_anime').update(item.id, animeData);
            console.log(`updated video: ${mal_id}`);
        } catch (_err){
            console.log(`error updating video: ${mal_id}`);
        }
        // wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    // console.log(anime);
    console.log("Done!");
}