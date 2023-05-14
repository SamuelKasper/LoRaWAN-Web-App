"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weather = void 0;
class Weather {
    fetch_weather(lat, lon) {
        if (process.env.FETCH_WEATHER) {
            let lang = "de";
            let unit = "metric";
            let url = `http://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=${unit}&lang=${lang}`;
            fetch(url)
                .then(resp => {
                if (!resp.ok) {
                    throw new Error(resp.statusText);
                }
                return resp.json();
            })
                .then(data => {
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
