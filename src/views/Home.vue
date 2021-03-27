<template>
    <div class="pa-15 d-flex">
        <api-loader @status="status" v-if="!loaded" :apis="this.apis"></api-loader>
        <div v-else :style="{flex: 1}">
            <api-chart :raw_data="history_to_api_object()" type="line" title="Krunker playercounts over the past months"></api-chart>
            <api-chart :raw_data="fetched_apis.current_playercount" type="bar" title="Current krunker playercounts"></api-chart>
        </div>
        <!-- <v-btn elevation="2" fab large absolute bottom right></v-btn> -->
    </div>
</template>

<script>
import apiChart from "@/components/ApiChart";
import apiLoader from "@/components/ApiLoader";

export default {
    name: 'Home',
    components: {
        apiChart,
        apiLoader
    },
    data: () => ({
        /*Feel free to use these api's! more information: https://github.com/SwatDoge/Krunker-API-resorter*/
        apis: [
            {title: 'current_playercount', url: 'https://swatdoge.nl/s/krunkerbrowser/api.php'},
            {title: 'history_playercount', url: 'https://swatdoge.nl/s/krunkerbrowser/krunker_playercount_history.php'},
            {title: 'history_playercount_keys', url: 'https://swatdoge.nl/s/krunkerbrowser/krunker_regions_registered.php'}
        ],
        fetched_apis: {},
        loaded: false
    }),
    methods: {
        history_to_api_object: function(){
            let shell = this.fetched_apis.history_playercount;
            let keys = this.fetched_apis.history_playercount_keys;
            if (!keys.success){
                shell.error = "Keys that belong to this api were not available",
                shell.success = false
            }
            if (!shell.success) return shell;
            let history_api_object = {};

            for (let gametype of Object.keys(this.fetched_apis.history_playercount.data)){ //2
                let sorted_api = this.fetched_apis.history_playercount.data[gametype].sort((a, b)=>{return a.date - b.date});
                let sorted_api_dates = sorted_api.map(date => {return date.date})
                history_api_object[gametype] ??= {};
                history_api_object[gametype].dates ??= sorted_api_dates;
                for (let date of sorted_api) {
                    for (let location of Object.keys(date)) {
                        if(!["id", "date"].includes(location)){
                            let location_keys = this.fetched_apis.history_playercount_keys.data.server_regions[location];
                            history_api_object[gametype][location_keys.region_name] ??= {}
                            history_api_object[gametype][location_keys.region_name][location_keys.country_name] ??= {}
                            history_api_object[gametype][location_keys.region_name][location_keys.country_name][location_keys.server_location] ??= []
                            history_api_object[gametype][location_keys.region_name][location_keys.country_name][location_keys.server_location].push(date[location]);
                        }
                    }
                }
            }
            console.log(history_api_object);
            
            shell.data = history_api_object;
            return shell;
        },
        status: function(status){
            this.fetched_apis = status;
            this.loaded = true;
        }
    }
}
</script>