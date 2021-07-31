scenes = [
    {
        highlight: "Gasoline",
        annotation: 0,
    },{
        highlight: "Hybrid",
        annotation: 1,
    },{
        highlight: "EV",
        annotation: 2,
    }
]

class VizState {
      constructor(curr_scene, highlighted) {
          this.curr_scene = 0
          this.highlighted = 0.0
      }
    }

viz_state: VizState = undefined

function show_scene(i){}

function next_scene(){
    viz_state.curr_scene += 1;
    show_scene(viz_state.curr_scene);
}

function init() {
    viz_state = VizState(-1, '');
    next_scene();
}
