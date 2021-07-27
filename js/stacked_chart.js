// TODO replace with a proper setup
// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 20, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

params = {
    highlighted: ''
}


function highlight(e, legend_val){
  // console.log(legend_val + '-' + params.highlighted)
  d3.selectAll(".legend_color").style("opacity",1)
  if (params.highlighted !== legend_val){
      d3.selectAll(".stream")
       .filter(function(e){
           // console.log(e.key)
           return e.key !== legend_val;
         })
       .style("opacity",0.1);
      d3.selectAll(".stream")
       .filter(function(e){
           return e.key === legend_val;
         })
       .style("opacity",1.0);
      params.highlighted = legend_val;
  } else {
      d3.selectAll(".stream")
       .filter(function(e){
           return e.key !== legend_val;
         })
       .style("opacity",1.0);
      params.highlighted = "";
  }
}


async function init() {
    // const raw_data = await d3.csv("./data/vehicles_small.csv");
    const raw_data = await d3.csv("./data/vehicles.csv", (d) => {
      return {
        id: d.id,
        year: d.year,
        atvType: (d.atvType == '') ? 'Petrol' : d.atvType
        // fuelType: d.fuelType
        // fuelType1: d.fuelType1,
        // fuelType2: d.fuelType2
      };
    });


    fuel_types = ['Diesel', 'Hybrid', 'Bifuel (CNG)', 'CNG', 'FFV', 'EV', 'Bifuel (LPG)', 'Plug-in Hybrid','Petrol']

    class Row {
      constructor() {
          this.model_year = 0
          this.Petrol = 0.0
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



    // console.log("data_rows:")
    // console.log(data_rows)
    // data_year_fuel_type = d3.flatRollup(raw_data, v => v.length, d => d.year, d => d.atvtype)
    // data_year_fuel_type = d3.rollups(raw_data, v => v.length, d => d.year, d => d.atvtype)
    // console.log(data_year_fuel_type)
    // data = d3.rollup(raw_data, v => v.length, d => d.year)
    // console.log(data)
    //
    // for (var row of data_year_fuel_type) {
    //     yearly_rollup = data[row[0]]
    //     if (!(row[1] in yearly_rollup)) {
    //         yearly_rollup[row[1]] = 0
    //     }
    //     yearly_rollup[row[1]] += data[row[2]]
    // }
    //
    // console.log ("Block statement execution no." + i);


    // List of fuel_types = header of the csv files = soil condition here
    // var fuel_types = data.columns.slice(1);

    // List of years
    var years = d3.map(data, function(d){return(d.model_year)});

    // Add X axis
    var x = d3.scaleBand()
      .domain(years)
      .range([0, width])
      .padding([0.2]);


    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, 1])
    .range([ height, 0 ]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(fuel_types)

    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
    .keys(fuel_types)
    (data);

    // console.log(stackedData)
    // Show the bars
    svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("class", "stream")
      .attr("fill", function(d) { return color(d.key); })
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
      .attr("stroke", color)
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
}