// Scene Params
scenes = [
    {
        highlight: "",
        annotation: 0,
    },{
        highlight: "Gasoline",
        annotation: 1,
    },{
        highlight: "Hybrid",
        annotation: 2,
    },{
        highlight: "EV",
        annotation: 3,
    },{
        highlight: "",
        annotation: 4,
    }
]


// Viz State
class VizState {
    constructor(curr_scene, highlighted) {
        this.curr_scene = curr_scene;
        this.highlighted = highlighted;
    }
}

var viz_state = undefined






// Viz Setup

// TODO replace with a proper setup
// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 40, left: 50},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("id", "main_canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


var color;

function clear_highlight() {
    d3.selectAll(".stream")
        .style("stroke", function(d) {color(d.key)});
        // .style("opacity", 1.0);
    viz_state.highlighted = "";
}



function highlight(e, legend_val){
  d3.selectAll(".legend_color").style("opacity",1)
  if (legend_val === '') {
      clear_highlight();
  } else if (viz_state.highlighted !== legend_val){
      d3.selectAll(".stream")
       .filter(function(e){
           return e.key !== legend_val;
         })
       .style("stroke", function(d) {color(d.key)});
      d3.selectAll(".stream")
       .filter(function(e){
           return e.key === legend_val;
         })
       .style("stroke", "#fff79e");
      viz_state.highlighted = legend_val;
  } else {
      clear_highlight();
  }
}

function get_stream_center(legend_val) {
    var selected_rects = d3.selectAll(".stream")
        .filter(function (e) {
            return e.key === legend_val;
        }).selectAll(".bar_slice")
        .filter(function (d) {
            return d.data[legend_val] > 0;
        });
    var _box = selected_rects.nodes()[Math.floor(selected_rects.size() / 2)].getBoundingClientRect();
    _box_center = [_box.x + (_box.width / 2), _box.top + (_box.height / 2)]
    return _box_center
}


function clear_annotations() {
    // remove existing annotation
    the_chart.select(".annotation-group")
        .remove()
}

function show_annotation(annotation_json) {
    var _annotations = [annotation_json]
    const makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .notePadding(0)
        .on('noteclick', function (annotation) {
            next_scene();
            // annotation.type.a.selectAll("g.annotation-connector, g.annotation-note")
            //   .classed("hidden", false)
        })
        .annotations(_annotations);

    // add new annotation
    the_chart.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
}

// annotation definitions
var annotations;
var the_chart;

function show_scene(i){
    clear_annotations();
    let annotation_ix = scenes[i].annotation;
    show_annotation(annotations[annotation_ix]);
    highlight({}, scenes[i].highlight)
}

function next_scene(){
    if (viz_state.curr_scene < 5) {
        viz_state.curr_scene = (viz_state.curr_scene + 1) % scenes.length;
    }
    show_scene(viz_state.curr_scene);
}

async function init() {
    // const raw_data = await d3.csv("./data/vehicles_small.csv");
    const raw_data = await d3.csv("./data/vehicles.csv", (d) => {
      return {
        id: d.id,
        year: d.year,
        atvType: (d.atvType == '') ? 'Gasoline' : d.atvType
        // fuelType: d.fuelType
        // fuelType1: d.fuelType1,
        // fuelType2: d.fuelType2
      };
    });


    fuel_types = ['Diesel', 'Hybrid', 'Bifuel (CNG)', 'CNG', 'FFV', 'EV', 'Bifuel (LPG)', 'Plug-in Hybrid','Gasoline']

    class Row {
      constructor() {
          this.model_year = 0
          this.Gasoline = 0.0
          this.Diesel = 0.0
          this.Hybrid = 0.0
          this['Bifuel (CNG)'] = 0.0
          this.CNG = 0.0
          this.FFV = 0.0
          this.EV = 0.0
          this['Bifuel (LPG)'] = 0.0
          this['Plug-in Hybrid'] = 0.0

      }
    }
    // aggregate by year and fuel type
    data = {}
    for (var record of raw_data){
        // Filter out incomplete years
        if (record.year > 2020) {
            continue;
        }

        if (!(record.year in data)){
            let row_obj = new Row();
            const {...row} = row_obj;
            row.model_year = parseInt(record.year);
            data[record.year] = row;
        }
        row = data[record.year]
        row[record.atvType] += 1.0
    }
    data = Object.values(data)

    // convert to relative
    for (datum of data) {
        datum.yearly_total = 0
        for (fuel_type of fuel_types){
            datum.yearly_total += datum[fuel_type]
        }
        for (fuel_type of fuel_types){
            datum[fuel_type] = datum[fuel_type] / datum.yearly_total
        }
    }


    // List of years
    var years = d3.map(data, function(d){return(d.model_year)});

    // Add X axis
    var x = d3.scaleBand()
      .domain(years)
      .range([0, width])
      .padding([0.2]);


    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
        .tickSizeOuter(0)
        .tickValues(x.domain().filter(function(d,i){ return !(i%2)}))
    );

    svg.append("text")
      .attr("transform",
            "translate(" + (width/2) + " ," +
                           (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text("Year");

    // Add Y axis
    var formatPercent = d3.format(".0%");

    var y = d3.scaleLinear()
    .domain([0, 0.6])
    .range([ height, 0 ]);
    svg.append("g")
    .call(d3.axisLeft(y).tickFormat(formatPercent));

    // Y Axis Label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("% Of Models");

    color_scheme = d3.schemeCategory10;
    color_scheme[8] = "orange";
    // color_scheme[1], color_scheme[9]  = color_scheme[9], color_scheme[1] ;
    [color_scheme[1], color_scheme[9]]  = [color_scheme[9], color_scheme[1]] ;
    [color_scheme[0], color_scheme[5]]  = [color_scheme[5], color_scheme[0]] ;
    // color palette = one color per subgroup
    // var color = d3.scaleOrdinal(d3.schemePaired)
    color = d3.scaleOrdinal(color_scheme)

       // .range(["silver", "blue", "green", "white", "pink", "cyan", "darkgreen", "violet", "orange"])

    .domain(fuel_types)
    // color[1] = "black";

    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
    .keys(fuel_types)
    (data);

    // Show the bars
    the_chart = svg.append("g")
        .attr("id", "the_chart")

    the_chart.selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
          .attr("class", "stream")
          .attr("fill", function(d) { return color(d.key); })
          .attr("stroke", function(d) { return color(d.key); })
          .attr("stroke-width", 2)
          .selectAll("rect")
          // enter a second time = loop subgroup per subgroup to add all rectangles
          .data(function(d) { return d; })
          .enter().append("rect")
            .attr("class", "bar_slice")
            .attr("x", function(d) { return x(d.data.model_year); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width",x.bandwidth());


    // ----- LEGEND -----

    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });



    // legend colors
    legend.append("rect")
      .attr("class", "legend_color")
      .attr("x", width - 17)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .on("click", highlight);
      // .on("click", function(d) {
      //   update(d)
      // })
    // ;

    // legend text
    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

    // Annotations

    welcome_annotation_point = [550,150]
    gasoline_annotation_point = [460,300] // get_stream_center('Gasoline')
    hybrid_annotation_point = [710,530] //get_stream_center('Hybrid')
    electric_annotation_point = [800,440] //get_stream_center('EV')

    annotations = [
        {
          note: {
              title: "Welcome",
              label: "The last 4 decades shown interesting innovations in alternative car fuels. In this chart " +
                  "we can see the yearly distribution of car models by fuel types. It allows us to see trends" +
                  "in the popularity of these fuel types, as they take a larger or smaller part of the total " +
                  "number of car models being produced.",
              wrap: 300,
              align: "right",
              lineType: "horizontal",
              orientation: "topBottom",
              bgPadding: {"top":15,"left":10,"right":10,"bottom":10},
          },
          connector: false,
          x: welcome_annotation_point[0], // 162
          y: welcome_annotation_point[1], // 137,
          dx: 0,
          dy: 0,

        },{
          note: {
              title: "Gasoline",
              label: "Gasoline is the traditional fuel type, and is still the most common in cars, as can be seen in the chart. However, since its peak in the 1990’s, it shows continued reduction in popularity, giving place to various alternative fuel types. \n" +
                  "Click to see some notable trends with Electricity based alternatives.\n",
              wrap: 300,
              align: "right",
              lineType: "horizontal",
              orientation: "topBottom",
              bgPadding: {"top":15,"left":10,"right":10,"bottom":10},
          },
          connector: {
            end: "dot"
          },
          x: gasoline_annotation_point[0], // 162
          y: gasoline_annotation_point[1], // 137,
          dx: -100,
          dy: -100,

        },
        {
          note: {
              title: "Hybrid",
              label: "Hybrid cars shown here refer to Hybrid Electric Cars, which combine a conventional internal combustion engine system with an electric propulsion system, and can achieve better fuel economy. \n " +
                  "It can be seen that since the early 2000s, Hybrid cars have continuously gained popularity.\n" +
                  "This might be considered as a sign for increasing interest in “zero emission”. In that aspect, Hybrid cars can be considered as a transitional technology, that, while only achieves Zero Emission at a fraction of the time in running Hybrid cars, allows a test bed for developing the technologies for the upcoming fully Electric Vehicles, without sacrificing the proven reliability and range of conventional Gasoline cars.\n" +
                  "Click to see some more about fully Electric Vehicles.\n",
              wrap: 350,
              align: "right",
              lineType:"horizontal",

          },
          connector: {
            end: "dot"
          },
          x: hybrid_annotation_point[0], // 162
          y: hybrid_annotation_point[1], // 137,
          dx: -200,
          dy: -100,


        },
        {
          note: {
              title: "Electric (EV)",
              label: "Electric Vehicles (EVs) fully rely on electric motors.The chart shows the initial take on EVs during late 1990s, which declined and then re-emerged at 2011, and has been increasing in popularity since then.",
              wrap: 350,
              align: "right",
              lineType:"horizontal",
          },
          connector: {
            end: "dot"
          },
          x: electric_annotation_point[0], // 162
          y: electric_annotation_point[1], // 137,
          dx: -200,
          dy: -100

        },
        {
          note: {
              title: "Explore alternative fuel trends on your own!",
              label: "Click the legend squares to highlight different fueld types",
              wrap: 150,
              align: "left",
              lineType:"horizontal",
          },
          connector: false,
          x: 10, // 162
          y: 10, // 137,
          dx: 10,
          dy: 10

        }
        ].map(function(d){
            d.color = "#000000";
            // d.fill = "rgba(61,105,153,0.42)";
            return d})


    viz_state = new VizState(-1, '');
    next_scene();

    // show_annotation(annotations[0]);
    // show_annotation(annotations[1]);
    // show_annotation(annotations[2]);

    // const makeAnnotations = d3.annotation()
    //   .type(d3.annotationLabel)
    //   .annotations(annotations);
    //
    // the_chart.append("g")
    //   .attr("class", "annotation-group")
    //   .call(makeAnnotations)
}



