"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weather = void 0;
const fetch = require("node-fetch");
class Weather {
    constructor() {
        this.weather_forecast = "no data available";
        this.city = "no data available";
    }
    /** Fetching weather data from open weather api. */
    fetch_weather(lat, lon) {
        return __awaiter(this, void 0, void 0, function* () {
            let lang = "de";
            let unit = "metric";
            let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=${unit}&lang=${lang}`;
            yield fetch(url)
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
        });
    }
    /** Set city and weather data. */
    check_weather(data) {
        console.log(data);
        let weather = data.list[0].weather[0].description;
        let rain_amount = data.list[0].rain['3h'] ? data.list[0].rain['3h'] : 0;
        this.city = data.city.name;
        this.weather_forecast = `${weather}: ${rain_amount}mm`;
    }
    /** Returning the city. */
    get get_city() {
        return this.city;
    }
    /** Returning the weather */
    get get_weather() {
        return this.weather_forecast;
    }
}
exports.Weather = Weather;
