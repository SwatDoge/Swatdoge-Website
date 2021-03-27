<script>
import { Line, mixins } from 'vue-chartjs';
const {reactiveProp} = mixins;

export default {
    extends: Line,
    mixins: [reactiveProp],
    data: () => ({
        options:{
            responsive: true,
            legend:{display: false},
            maintainAspectRatio: false,
        }
    }),
    mounted(){
        this.renderChart(this.chartData, this.options);
    },
}
</script>