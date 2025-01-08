import CryptoJS from "https://esm.sh/crypto-js@4.1.1";

export async function getVideoUrl(videoId: number | null, address: string | null) {
    if (videoId == null || videoId < 0 || address == null) {
        return null;
    }
    const videoProviderRequest = await fetch(`https://www.animeunity.to/embed-url/${videoId}` , {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "priority": "u=0, i",
          "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Linux\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    });
    const videoUrl = await videoProviderRequest.text();
    console.log('videoUrl', videoUrl);
    const videoRequest = await fetch(videoUrl);
    const videoData = await videoRequest.text();
    // //regex to get metadata
    // const videoMetadata = videoData.match(/window\.video\s*=\s*({[\s\S]*?});/);
    // if (videoMetadata) {
    //     const videoMetadataJson = JSON.parse(videoMetadata[1]);
    //     const tokenDownload = generateToken(2, address, "Yc8U6r8KjAKAepEA");
    //     const downloadUrl = "https://au-d1-0" + videoMetadataJson.proxy_download + ".scws-content.net/download/" +
    //         videoMetadataJson.storage_download.number + "/" + videoMetadataJson.folder_id + "/" + videoMetadataJson.quality + "p.mp4" + "?token=" + tokenDownload + "&filename=" + encodeURIComponent(videoMetadataJson.name.replace(/ /g, '_').replace('&', '.'));

    //     console.log('downloadUrl', downloadUrl);

    //     return downloadUrl;
    // }
    
    const videoPlaylist = videoData.match(/window\.masterPlaylist\s*=\s*({[\s\S]*?}[\s\S]*?})/);
    if (videoPlaylist) {
        console.log('videoPlaylist', videoPlaylist[1]);
        // const videoPlaylistJson = JSON.parse(videoPlaylist[1]);
        // console.log('videoPlaylistJson', `${videoPlaylistJson.url}?token=${videoPlaylistJson.params.token}&expires=${videoPlaylistJson.params.expires}&h=1`);
    }

    const regex = /window\.downloadUrl = '([^']+)'/;
    const result = regex.exec(videoData);
    if (result) {
        console.log('result', result[1]);
        return result[1];
    }
    return null;
}

function generateToken(hours: number, client_ip : string, secret : string) {
    var MD5 = function(d: any) {
        var r = M(V(Y(X(d), 8 * d.length)));
        return r.toLowerCase()
    };
    function M(d: any) {
        for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++)
            _ = d.charCodeAt(r),
            f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _);
        return f
    }
    function X(d: any) {
        for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++)
            _[m] = 0;
        for (m = 0; m < 8 * d.length; m += 8)
            _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32;
        return _
    }
    function V(d: any) {
        for (var _ = "", m = 0; m < 32 * d.length; m += 8)
            _ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255);
        return _
    }
    function Y(d: any, _: any) {
        d[_ >> 5] |= 128 << _ % 32,
        d[14 + (_ + 64 >>> 9 << 4)] = _;
        for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) {
            var h = m
              , t = f
              , g = r
              , e = i;
            f = md5_ii(f = md5_ii(f = md5_ii(f = md5_ii(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_ff(f = md5_ff(f = md5_ff(f = md5_ff(f, r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551),
            m = safe_add(m, h),
            f = safe_add(f, t),
            r = safe_add(r, g),
            i = safe_add(i, e)
        }
        return Array(m, f, r, i)
    }
    function md5_cmn(d: any, _: any, m: any, f: any, r: any, i: any) {
        return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m)
    }
    function md5_ff(d: any, _: any, m: any, f: any, r: any, i: any, n: any) {
        return md5_cmn(_ & m | ~_ & f, d, _, r, i, n)
    }
    function md5_gg(d: any, _: any, m: any, f: any, r: any, i: any, n: any) {
        return md5_cmn(_ & f | m & ~f, d, _, r, i, n)
    }
    function md5_hh(d: any, _: any, m: any, f: any, r: any, i: any, n: any) {
        return md5_cmn(_ ^ m ^ f, d, _, r, i, n)
    }
    function md5_ii(d: any, _: any, m: any, f: any, r: any, i: any, n: any) {
        return md5_cmn(m ^ (_ | ~f), d, _, r, i, n)
    }
    function safe_add(d: any, _: any) {
        var m = (65535 & d) + (65535 & _);
        return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m
    }
    function bit_rol(d: any, _: any) {
        return d << _ | d >>> 32 - _
    }
    var expires = new Date(Date.now() + (1000 * 60 * 60 * hours)).getTime();
    expires = Math.round(expires / 1000);
    var input = expires + client_ip + " " + secret;
    var binaryHash = CryptoJS.MD5(input);
    var base64Value = binaryHash.toString(CryptoJS.enc.Base64);
    return base64Value.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') + "&expires=" + expires.toString();
}