let currId = 0;
export default {
  increment() { 
    currId++;
    return currId;
  },
  reset(){
    currId = 0
  },
  get(){
    return currId;
  }
}