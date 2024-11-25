import type PocketBase from "https://esm.sh/pocketbase@0.22.0";

interface HtmlEntities {
    [key: string]: string;
}

export function decodeHTMLString(encodedString: string) {
    const htmlEntities: HtmlEntities = {
        "&quot;": "\"",
        "&amp;": "&",
    };

    const decodedString = encodedString.replace(/(&quot;|&amp;)/g, match => htmlEntities[match as keyof HtmlEntities]);
    return decodedString;
}

export function dbAuth(pb: PocketBase) {
    return pb.admins.authWithPassword(
        Deno.env.get("ADMIN_EMAIL") ?? "",
        Deno.env.get("ADMIN_PASSWORD") ?? "",
    );
}