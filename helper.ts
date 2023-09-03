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