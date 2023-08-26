let rnd = 'anon_' + Math.random().toString(36).substring(2)
async function telemetry(e, n) {
    try {
        if (process.env.DISABLE_TELEMETRY) return
        ;(e = 'INFR_DESKTOP_APP_' + e),
            n || (n = {}),
            (n.enviroment = process.env.ENVIRONMENT)
        let t = process.env.NEXT_PUBLIC_APP_ID
        t || (t = rnd),
            fetch(
                'https://i.getinfr.com/api/telemetry?event=' +
                    encodeURIComponent(e) +
                    '&distinct_id=' +
                    encodeURIComponent(t) +
                    '&properties=' +
                    encodeURIComponent(JSON.stringify(n)),
            )
    } catch (e) {}
}
module.exports = telemetry
