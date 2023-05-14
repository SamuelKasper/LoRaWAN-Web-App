"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weather = void 0;
const fetch = require("node-fetch");
class Weather {
    fetch_weather(lat, lon) {
        if (process.env.FETCH_WEATHER == "false") {
            let lang = "de";
            let unit = "metric";
            let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=${unit}&lang=${lang}`;
            console.log(url);
            fetch(url)
                .then((resp) => {
                if (!resp.ok) {
                    throw new Error(resp.statusText);
                }
                return resp.json();
            })
                .then((data) => {
                this.show_weather(data);
            })
                .catch(console.error);
        }
        else {
            console.log("FETCH_WEATHER is disabled");
        }
    }
    show_weather(data) {
        console.log(data);
    }
}
exports.Weather = Weather;
