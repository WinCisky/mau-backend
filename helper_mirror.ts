import CryptoJS from "https://esm.sh/crypto-js@4.1.1";

export async function getVideoUrl(videoId: number | null, address: string | null) {
    if (videoId == null || videoId < 0 || address == null) {
        return null;
    }
    const videoProviderRequest = await fetch(`https://tight-butterfly-8323.xsimone97.workers.dev/?id=${videoId}`);
    const videoUrl = await videoProviderRequest.text();
    console.log('videoUrl', videoUrl);
    const videoRequest = await fetch(videoUrl);
    const videoData = await videoRequest.text();

    const regex = /window\.downloadUrl = '([^']+)'/;
    const result = regex.exec(videoData);
    if (result) {
        console.log('result', result[1]);
        return result[1];
    }
    return null;
}