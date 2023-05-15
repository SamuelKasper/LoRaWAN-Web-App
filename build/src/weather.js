"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weather = void 0;
const fetch = require("node-fetch");
class Weather {
    fetch_weather(lat, lon) {
        let lang = "de";
        let unit = "metric";
        let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=${unit}&lang=${lang}`;
        fetch(url)
            .then((resp) => {
            if (!resp.ok) {
                throw new Error(resp.statusText);
            }
            return resp.json();
        })
            .then((data) => {
            this.check_weather(data);
        })
            .catch(console.error);
    }
    check_weather(data) {
        for (let i = 0; i <= 3; i++) {
            let weather = data.list[i].weather;
            let rain = data.list[i].rain;
            let city = data.city.name;
            console.log(weather);
            console.log("-------------------------------");
            console.log(rain);
            console.log("-------------------------------");
            console.log(city);
        }
    }
}
exports.Weather = Weather;
