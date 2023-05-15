const fetch = require("node-fetch");
export class Weather {
    private weather_forecast: string ="no data available";
    private city: string = "no data available";

    /** Fetching weather data from open weather api. */
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

    /** Set city and weather data. */
    public check_weather(data: any) {
        let weather: string = data.list[0].weather.main;
        let rain_amount:number = data.list[0].rain['3h'] ? data.list[0].rain['3h'] : 0;
        this.city = data.city.name;
        this.weather_forecast = `${weather}: ${rain_amount}mm`;
    }

    /** Returning the city. */
    public get get_city(){
        return this.city;
    }

    /** Returning the weather */
    public get get_weather(){
        return this.weather_forecast;
    }
}