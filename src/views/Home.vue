<template>
    <div class="pa-15 d-flex">
        <v-card flat :style="{flex: '1'}">
            <v-card-title primary-title>Current krunker playercount</v-card-title>
            <div class="d-flex" :style="{maxHeight: '400px'}">
                <div :style="{maxHeight: '400px', flex: 1}">
                    <current-player-chart :chartData="filtered_data"/>
                </div>
                <v-card :style="{width: '400px'}" class="flex-column d-flex mx-5" flat>
                    <v-card-title primary-title class="pb-0">
                        Choose servers
                    </v-card-title>
                    <v-card-text :style="{overflowY: 'auto', flex: 1}" class="d-flex flex-column">
                        <v-treeview v-if="tree_data_loaded" ref="treeview" @input="selection_changes" v-model="pre_select" :items="tree_data" selectable open-on-click transition return-object selected-color="#558B2F"/>
                        <v-progress-circular v-else indeterminate color="green" :style="{alignSelf: 'center', flex: 1}"/>
                    </v-card-text>
                </v-card>
            </div>
        </v-card>
    </div>
</template>

<script>
import currentPlayerChart from "../components/TotalChart";
import external_tree_id from "../modules/counter";

export default {
    name: 'Home',
    components: {currentPlayerChart},
    mounted(){
        external_tree_id.reset();
        fetch("https://swatdoge.nl/s/krunkerbrowser/api.php"/*Feel free to use this api! more information: https://github.com/SwatDoge/Krunker-API-resorter*/)
        .then(data => {return data.json()})
        .then(json => {
            this.history_data = json;
            this.tree_data = this.create_tree_children(this.history_data);
        })
    },
    data: () => ({
        history_data: {},
        filtered_data: {},
        tree_data: {},
        tree_data_loaded: false,

        data_per_key: [],
        pre_select: [],
        color_bale: ["#9CCC65", "#558B2F",],
    }),
    watch: {
        tree_data_loaded: function (){
            this.$nextTick(() => {
                this.$refs.treeview.emitSelected();
            })
        }
    },
    methods:{
        cap(str){
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
            this.tree_data_loaded = true;
            return children;
        },
        selection_changes: function(selected_items){
            let placeholder = {}, 
                player_count_slot = 1,
                available_types = [],
                available_items = [],
                available_keys = []

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

            
            //the datasets
            let sets = {
                labels: available_items,
                datasets: []
            }

            //datasets creation
            for (let [index, type] of available_types.entries()) {
                sets.datasets.push({
                    label: type,
                    backgroundColor: this.color_bale[index],
                    data: placeholder[type]
                })
            }

            //apply
            this.filtered_data = sets;
        }
    },
}
</script>