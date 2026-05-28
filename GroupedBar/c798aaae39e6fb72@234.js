function _1(md){return(
md`# Grouped Bar Chart`
)}

function _chart(d3,data)
{
  const width = 900;
  const height = 600;
  const marginTop = 60;
  const marginBottom = 60;
  const marginLeft = 70;
  const marginRight = 70;

  const avgdata = d3.rollups(
    data, 
    v => ({
      stress_level: d3.mean(v, d => d.stress_level),
      anxiety_level: d3.mean(v, d => d.anxiety_level)
    }),
    d => d.platform_usage
  ).flatMap(([platform_usage, values]) => [
    {platform_usage: platform_usage, type: "Anxiety", value: values.anxiety_level},
    {platform_usage: platform_usage, type: "Stress", value: values.stress_level}
  ]);

  const platforms = new Set(avgdata.map(d => d.platform_usage));
  const types = Array.from(new Set(avgdata.map(d => d.type)));

  const fx = d3.scaleBand()
  .domain(platforms)
  .rangeRound([marginLeft, width - marginRight])
  .paddingInner(0.1);

  const x = d3.scaleBand()
  .domain(types)
  .rangeRound([0, fx.bandwidth()])
  .padding(0.05);

  const color = d3.scaleOrdinal()
  .domain(types)
  .range(["#f4a6c1", "#a9d6ff"])
  .unknown("#ccc");

  const y = d3.scaleLinear()
  .domain([0, 7])
  .rangeRound([height - marginBottom, marginTop]);

  const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "display: block; margin: auto; max-width: 100%; height: auto;");

  const bars = svg.append("g")
  .selectAll("g")
  .data(d3.group(avgdata, d => d.platform_usage))
  .join("g")
    .attr("transform", ([platform_usage]) => `translate(${fx(platform_usage)},0)`)
  .selectAll()
  .data(([, d]) => d)
  .join("rect")
    .attr("x", d => x(d.type))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", d => color(d.type))

  // tooltip - hover
  const tooltipLabel = svg.append("text")
  .attr("display", "none")
  .style("font-size", "12px")
  .style("font-weight", "bold")
  .style("pointer-events", "none");

  bars.on("pointerenter", function(event, d) {
    bars
      .transition()
      .duration(150)
      .style("opacity", 0.25);
    
    d3.select(this)
      .transition()
      .duration(150)
      .style("opacity", 1)
      .selection()
      .raise();

    tooltipLabel
    .attr("display", null)
    .text(`${d.platform_usage} ${d.type}: ${d.value.toFixed(2)}`);
  })
    
  .on("pointermove", function(event, d){
    const [xm, ym] = d3.pointer(event, svg.node());

    tooltipLabel
    .attr("x", xm + 10)
    .attr("y", ym - 10)
    .text(`${d.platform_usage} ${d.type}: ${d.value.toFixed(2)}`);
  })
    
  .on("pointerleave", function(){
    bars
      .transition()
      .duration(150)
      .style("opacity", 1);
    tooltipLabel
      .attr("display", "none");
  });
    
  svg.append("g")
  .attr("transform", `translate(0, ${height - marginBottom})`)
  .call(d3.axisBottom(fx).tickSizeOuter(0))
  .call(g => g.selectAll(".domain").remove());

  svg.append("g")
  .attr("transform", `translate(${marginLeft},0)`)
  .call(d3.axisLeft(y).ticks(null, "s"))
  .call(g => g.selectAll(".domain").remove());

  // Title 
  svg.append("text")
  .attr("x", (width - marginRight)/2)
  .attr("y", 25)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .text("Average Anxiety and Stress Level by Platform Usage");
  
  // x-axis label
  svg.append("text")
  .attr("x", width/2)
  .attr("y", height-25)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .text("Platform");
  
  // y-axis label
  svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .text("Average Level");

  // Legend
  const legend = svg.append("g")
  .attr("transform", `translate(${width - 60}, ${height - 400})`)

  // Create legend of types
  legend.selectAll("g")
  .data(types)
  .join("g")
  .attr("transform", (d, i) => `translate(0, ${i*25})`)
  .style("cursor", "pointer") // click
  .on("click", function(event, selectedType) {
    bars
    .style("opacity", d => d.type === selectedType ? 1 : 0.15);
  })
  .call(g => {
    g.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => color(d));

    g.append("text")
      .attr("x", 25)
      .attr("y", 13)
      .text(d => d)
      .style("font-size", "10px");
  });

  // Legend label
  legend.append("text")
  .attr("x", 0)
  .attr("y", -10)
  .style("font-size", "13px")
  .style("font-weight", "bold")
  .text("Type");

  return Object.assign(svg.node(), {scales: {color}});
}


function _data(FileAttachment){return(
FileAttachment("Teen_Mental_Health_Dataset.csv").csv({typed: true})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Teen_Mental_Health_Dataset.csv", {url: new URL("./files/beb4fdd3f77b7687883ca44c69d9bf49446fb27e5a7fba1320e911cc897fd2f7702ba349bfbb75df0c7482766fd66e99ce665a9a91a2965818b1385e9d8537f9.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
