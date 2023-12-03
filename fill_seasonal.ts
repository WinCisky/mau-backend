import type PocketBase from "https://esm.sh/pocketbase@0.15.3";

export async function fillSeasonal(pb: PocketBase) {
    const filter = "start=null";
    const anime_list = await pb.collection('mau_seasonal').getList(1, 20, {
        filter: filter,
    });

    for (let i = 0; i < anime_list.items.length; i++) {
        // get from mal api
        const mal_id = anime_list.items[i].mal_id;
        const resp = await fetch(`https://api.myanimelist.net/v2/anime/${mal_id}?fields=start_date,synopsis`, {
            headers: {
                "X-MAL-CLIENT-ID" : Deno.env.get("MAL_CLIENT_ID") ?? ""
            }
        });
        const data = await resp.json();
        const dateStart = Date.parse(data.start_date);
        const formattedDate = (new Date(dateStart)).toISOString().slice(0, 10);
        // console.log(formattedDate);
        const anime = {} as any;
        anime["plot"] = data.synopsis;
        anime["start"] = formattedDate;
        const id = anime_list.items[i].id;
        await pb.collection('mau_seasonal').update(id, anime);
    }

    // console.log(anime_list);
}