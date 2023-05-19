export class Distance_sensor {
    private static instance: Distance_sensor;
    private waterlevel_percent: number = -1;

    /** Get instance for Distance_sensor class. */
    public static get getInstance(){
        return this.instance;
    }

    /** Setting value for waterlevel_percent. */
    public set_waterlevel(data: DB_entrie) {
        if (data.max_distance != undefined && data.distance != undefined) {
            this.waterlevel_percent = 100 - (data.distance / data.max_distance * 100);
            console.log("Set waterlevel to: ", this.waterlevel_percent);
        }
    }

    /** Returning value for waterlevel_percent. */
    public get get_waterlevel(){
        return this.waterlevel_percent;
    }
}