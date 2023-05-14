const fetch = require("node-fetch") ;
export class Weather {
    public fetch_weather(lat: number, lon: number) {
            let lang = "de";
            let unit = "metric";
            let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=${unit}&lang=${lang}`;
            fetch(url)
                .then((resp: { ok: any; statusText: string | undefined; json: () => any; }) => {
                    if (!resp.ok) {
                        throw new Error(resp.statusText);
                    }
                    return resp.json();
                })
                .then((data: any) => {
                    this.check_weather(data);
                })
                .catch(console.error);
    }

    public check_weather(data: any) {
        console.log(data);
    }
}