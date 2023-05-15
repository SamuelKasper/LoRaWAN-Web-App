interface DB_entrie {
    time: string,
    dev_eui: string,
    name: string,
    gateway: string,
    rssi: number,
    city: string,
    weather_forecast_3h: string;
    description: string,
    // Sensor data
    air_temperature?: number, 
    air_humidity?: number,
    soil_temperature?: string,
    soil_humidity?: string, 
    distance?: number,
    // Editable fields
    max_distance?: number, 
    hum_min?: number, 
    hum_max?: number,
    watering_time?: string,
    time_control?: string
}