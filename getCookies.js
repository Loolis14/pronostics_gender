export function getCookies(request) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
        return {};
    }

    return Object.fromEntries(
        cookieHeader.split(";").map(cookie => {
            const [key, value] = cookie.trim().split("=");
            return [key, value];
        })
    );
}
