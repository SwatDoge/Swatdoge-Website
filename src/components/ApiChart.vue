<template>
    <v-card flat :style="{flex: '1'}">
        <div class="d-flex">
            <v-card-title primary-title>{{title}}</v-card-title>                    
            <v-btn-toggle @change="time_selection" v-if="type === 'line'" color="green darken-3" :style="{alignItems: 'center'}" borderless group mandatory tile dense>
                <v-btn small value="0">All</v-btn>
                <v-btn small value="31557600000">1 year</v-btn>
                <v-btn small value="15778800000">6 months</v-btn>
                <v-btn small value="2629800000">1 month</v-btn>
                <v-btn small value="604800000">1 week</v-btn>
                <v-btn small value="86400000">24 Hours</v-btn>
            </v-btn-toggle>
        </div>
        <div class="d-flex" :style="{maxHeight: '400px', backgroundColor: warning_color}">
            <div v-if="!this.raw_data.success" :style="{position: 'absolute', display: 'flex', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center'}">
                <div :style="{position: 'relative', width: '100%', textAlign: 'center'}">
                    <p>This chart could sadly not load, try again later</p>
                    <p>Error: {{this.raw_data.error}}</p>
                    <v-btn color="error">try again</v-btn>
                </div>
            </div>
            <div :style="{maxHeight: '400px', flex: 1}">
                <bar-chart :chartData="filtered_data" v-if="type === 'bar'"></bar-chart>
                <line-chart :chartData="filtered_data" v-else></line-chart>
            </div>
            <v-card :style="{width: '400px'}" color="transparent" class="flex-column d-flex mx-5" flat>
                <v-card-title primary-title class="pb-0" v-if="raw_data.success">
                    Choose servers
                </v-card-title>
                <v-card-text :style="{overflowY: 'auto', flex: 1}" class="d-flex flex-column">
                    <v-treeview v-if="tree_data_loaded" ref="treeview" @input="selection_changes" v-model="pre_select" :items="tree_data" selectable open-on-click transition return-object selected-color="#558B2F"/>
                </v-card-text>
            </v-card>
        </div>
    </v-card>
</template>

<script>
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import external_tree_id from "@/modules/counter";
export default {
    props: ["type", "raw_data", "title"],
    components: {BarChart, LineChart},
    mounted(){
        external_tree_id.reset();
        let vm = this;
        vm.$nextTick(() => {
            if (this.raw_data.success) this.tree_data = this.create_tree_children(this.raw_data.data)
            else this.warning_color = 'rgba(160, 160, 160, .5)';
        })
    },
    data: () => ({
        warning_color: 'white',
        tree_data: {},
        filtered_data: {},
        tree_data_loaded: false,
        data_per_key: [],
        pre_select: [],
        ms_offset: 0,
        color_bale: ["#439f75","#51913c","#4a9651","#459b63", "#4fb381", "#63b345", "#58b45c", "#51b470"],
    }),
    watch: {
        tree_data_loaded: function (){
            this.$nextTick(() => {this.$refs.treeview.emitSelected();})
        },
    },
    methods: {
        choke: function(arr, min_offset, offset){
            if (min_offset == 0) return arr;
            let ret = [];
            let max = Math.round(new Date().getTime() / 1000) - offset;
            let min = max - (min_offset / 1000);
            for (let value of arr) {
                if (value > min && value < max){
                ret.push(value)
                }
            }
            return ret;
        },
        time_selection: function(e){
            this.ms_offset = e;
        },
        array_cutoff: function(arr, amount){
            let pl = [];
            if (amount > arr.length) amount = arr.length;
            let devide = arr.length / amount;
            let generalize = [];
            let offset = 0;
            for (let i = 0; i < arr.length; i++){
                offset++;
                generalize.push(arr[i])
                if (offset === Math.round(devide)){
                    let x = 1;
                    generalize.map(value => {x += parseInt(value)})
                    pl.push(Math.round(x / devide))
                    generalize = [];
                    offset = 0;
                }
                //     offset = 0;
                //     var x = 0;
                //     for (let value in generalize) x += value;
                //     pl.push(Math.round(x / generalize.length));
                //     generalize = [];
                // }
                //pl.push(arr[(Math.round(i * devide) + Math.round(devide / amount))])
            }

            return pl;
        },
        cap: function(str){
            return str.split("_").map((i) => {return i[0].toUpperCase() + i.substring(1);}).join(" ");
        },
        create_tree_children: function(api_object, index = 0, parent_name = "", type = ""){
            let children = [];
            index++;

            //keys for the graph
            if (index - 1 >= 4){ 
                this.data_per_key.push({
                    type: type,  
                    obj: api_object,
                    name: this.cap(parent_name), 
                    key: external_tree_id.get()
                })
                return
            }

            //keys for the list
            for (let tab in api_object){
                if (tab !== "dates"){
                    //main categories
                    if (index - 1 === 0){
                        this.pre_select.push({
                            id: external_tree_id.get() + 1
                        })
                    }

                    children.push({
                        name: this.cap(tab),
                        id: external_tree_id.increment(),
                        children: this.create_tree_children(api_object[tab], index, tab, (index === 1 ? tab : type))
                    });
                }
            }
            this.tree_data_loaded = true;
            return children;
        },
        selection_changes: function(selected_items){
            let placeholder = {}, 
                player_count_slot = 1,
                available_types = [],
                available_items = [],
                available_keys = []
            
            //the datasets
            let sets = {
                labels: [],
                datasets: []
            }

            //available_items
            selected_items.map(item => {if (!available_items.includes(item.name)) available_items.push(item.name);})

            //available_keys
            selected_items.map(sel_item => {available_keys.push(sel_item.id)});
            
            //available_types
            selected_items.map(types => {
                this.data_per_key.map(all_keys => {
                    if (!available_types.includes(all_keys.type) && types.id === all_keys.key) available_types.push(all_keys.type);
                })
            })

            if (this.type === "bar"){
                sets.labels = available_items;
                //data creation
                for (let labels of available_items){
                    for (let type of available_types) {
                        let item = 0;
                        for (let data_key of this.data_per_key) {
                            if (data_key.name === labels && data_key.type === type && available_keys.includes(data_key.key)){
                                for (let game of data_key.obj) item += game[player_count_slot]
                                break;
                            }
                        }
                        placeholder[type] ??= []
                        placeholder[type].push(item);
                    }
                }

                //datasets creation
                for (let [index, type] of available_types.entries()) {
                    sets.datasets.push({
                        label: type,
                        backgroundColor: this.color_bale[index],
                        data: placeholder[type]
                    })
                }
            }
            if (this.type === "line"){
                for (let labels of available_items){
                    for (let type of available_types) {
                        let lbl = this.array_cutoff(this.choke(this.raw_data.data[type].dates, this.ms_offset, 0), 40).map(date => {return new Date(date * 1000).toDateString()});
                        sets.labels = lbl;
                        for (let data_key of this.data_per_key) {
                            if (data_key.name === labels && data_key.type === type && available_keys.includes(data_key.key)){
                                let number = (Math.round(Math.random() * this.color_bale.length));
                                let color = this.color_bale[number];
                                sets.datasets.push({
                                    label: this.cap(data_key.type) + " - " + data_key.name,
                                    data: this.array_cutoff(data_key.obj, 40, this.ms_offset),
                                    borderColor: color,
                                    backgroundColor: color,
                                    fill: false
                                })
                                break;
                            }
                        }                        
                    }
                }
            }
            this.filtered_data = sets;
        }
    }
}
</script>

<style>

</style>