<template>
    <v-container>
        <div v-if="stage_obj.url === null">initializing...</div>
        <div v-else>
            Loading the "<a :href="stage_obj.url" target="_blank">{{stage_obj.title}}</a>" api...
        </div>
        <v-progress-linear color="green lighten-1" height="30" :value="stage / apis.length * 100" striped>
            {{stage}} / {{apis.length}}
        </v-progress-linear>
    </v-container>
</template>

<script>
export default {
    props: ["apis"],
    mounted(){
        let vm = this;
        vm.$nextTick(() => {
            for (let api of this.apis) {
                fetch(api.url)
                .then(data => {
                    return data.json()
                })
                .then(json => {
                    this.fetched_data[api.title] = {data: json, success: true, error: null};
                })
                .catch(e => {
                    this.fetched_data[api.title] = {data: null, success: false, error: e.message};
                })
                .finally(e => {
                    this.stage++;
                    this.stage_obj = api;
                    if (this.stage === this.apis.length) this.$emit("status", this.fetched_data)
                })
            }            
        })
    },
    data: () => ({
        stage: 0,
        stage_obj: {title: "initializing...", url: null},
        fetched_data: {}
    })
}
</script>

<style>

</style>