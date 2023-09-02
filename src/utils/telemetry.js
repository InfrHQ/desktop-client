// prettier-ignore
// eslint-disable-next-line no-use-before-define
async function telemetry(t,e){try{if(process.env.DISABLE_TELEMETRY||(e||(e={}),"object"!=typeof e))return;e.enviroment=process.env.NEXT_PUBLIC_ENVIRONMENT,e.host=window.location.host,e.url=window.location.href,e.event=t,e.date_created=Math.floor(Date.now()/1e3),fetch("https://i.getinfr.com/api/telemetry?&app_id="+encodeURIComponent("desktop-app")+"&properties="+encodeURIComponent(JSON.stringify(e)))}catch(o){}}
module.exports = telemetry
