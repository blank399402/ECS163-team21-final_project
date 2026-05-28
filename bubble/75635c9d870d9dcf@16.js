function _1(md){return(
md`# Bubble chart `
)}

function _teen_mental_health_dataset(__query,FileAttachment,invalidation){return(
__query(FileAttachment("Teen_Mental_Health_Dataset.csv"),{from:{table:"Teen_Mental_Health_Dataset"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

async function _bubbleChart(FileAttachment,d3,invalidation)
{
  const data = await FileAttachment("Teen_Mental_Health_Dataset.csv").csv({ typed: true });

  // pre-compute jitter once so bubbles don't jump around
  data.forEach(d => d._jitter = (Math.random() - 0.5) * 22);

  const width = 900;
  const height = 560;
  const margin = { top: 50, right: 160, bottom: 60, left: 70 };

  const platformColor = {
    "Instagram": "#f4a261",
    "TikTok":    "#e76f51",
    "Both":      "#457b9d",
    "All":       "#888",
  };

  function socialToNum(s) {
    if (s === "low") return 1;
    if (s === "medium") return 2;
    return 3;
  }

  const z = d3.scaleSqrt().domain([1, 3]).range([5, 18]);

  const x = d3.scaleLinear()
    .domain([0, 10])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.academic_performance) - 0.2, d3.max(data, d => d.academic_performance) + 0.2])
    .range([height - margin.bottom, margin.top]);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "sans-serif")
    .style("background", "#fff")
    .style("cursor", "pointer");

  // axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(10))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", 45).attr("text-anchor", "middle")
      .attr("fill", "#333").attr("font-size", 13)
      .text("Addiction Level"));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(8))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + height - margin.bottom) / 2)
      .attr("y", -50).attr("text-anchor", "middle")
      .attr("fill", "#333").attr("font-size", 13)
      .text("Academic Performance"));

  // title
  svg.append("text")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", 18).attr("text-anchor", "middle")
    .attr("font-size", 14).attr("font-weight", "bold")
    .attr("fill", "#222")
    .text("Addiction Level vs. Academic Performance");

  // platform label that updates as it cycles
  const platformLabel = svg.append("text")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", 36).attr("text-anchor", "middle")
    .attr("font-size", 13).attr("fill", "#666");

  // pause 
  const pauseLabel = svg.append("text")
    .attr("x", width - margin.right + 20)
    .attr("y", height - margin.bottom)
    .attr("font-size", 11).attr("fill", "#aaa")
    .text("Click to pause");

  // tooltip
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.78)")
    .style("color", "#fff")
    .style("padding", "9px 13px")
    .style("border-radius", "7px")
    .style("font-size", "13px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("line-height", "1.6");

  const bubbleGroup = svg.append("g");

  // cycling order
  const cycle = ["All", "Instagram", "TikTok", "Both"];
  let cycleIndex = 0;
  let paused = false;
  let intervalId = null;

  function renderBubbles(platform) {
    const filtered = platform === "All"
      ? data
      : data.filter(d => d.platform_usage === platform);

    const color = platformColor[platform];

    platformLabel
      .text(platform === "All" ? "Showing: All Platforms" : `Showing: ${platform}`)
      .attr("fill", platform === "All" ? "#666" : color);

    const circles = bubbleGroup.selectAll("circle")
      .data(filtered, d => d.age + d.gender + d.addiction_level + d.academic_performance + d._jitter);

    // exit
    circles.exit()
      .transition().duration(400)
      .attr("r", 0)
      .remove();

    // enter + update
    circles.enter()
      .append("circle")
        .attr("cx", d => x(d.addiction_level) + d._jitter)
        .attr("cy", d => y(d.academic_performance))
        .attr("r", 0)
        .attr("fill", d => platformColor[d.platform_usage])
        .attr("fill-opacity", 0.65)
        .attr("stroke", d => platformColor[d.platform_usage])
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
      .merge(circles)
      .on("mouseover", function(event, d) {
        bubbleGroup.selectAll("circle")
          .attr("fill-opacity", c => c === d ? 1 : 0.1)
          .attr("stroke-width", c => c === d ? 2 : 0.5);
        tooltip.style("opacity", 1)
          .html(`<strong>Platform:</strong> ${d.platform_usage}<br/>
                 <strong>Addiction:</strong> ${d.addiction_level}<br/>
                 <strong>Academic:</strong> ${d.academic_performance.toFixed(2)}<br/>
                 <strong>Social:</strong> ${d.social_interaction_level}<br/>
                 <strong>Age:</strong> ${d.age}`);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        bubbleGroup.selectAll("circle")
          .attr("fill-opacity", 0.65).attr("stroke-width", 0.5);
        tooltip.style("opacity", 0);
      })
      .transition().duration(500)
        .attr("cx", d => x(d.addiction_level) + d._jitter)
        .attr("cy", d => y(d.academic_performance))
        .attr("r", d => z(socialToNum(d.social_interaction_level)));
  }

  function nextSlide() {
    cycleIndex = (cycleIndex + 1) % cycle.length;
    renderBubbles(cycle[cycleIndex]);
  }

  // cycling
  renderBubbles(cycle[cycleIndex]);
  intervalId = setInterval(nextSlide, 2500);

  // click anywhere to pause/resume
  svg.on("click", function(event) {
    // don't pause if clicking a bubble (let tooltip handle it)
    if (event.target.tagName === "circle") return;
    paused = !paused;
    if (paused) {
      clearInterval(intervalId);
      pauseLabel.text("PAUSED — click to RESUME");
    } else {
      intervalId = setInterval(nextSlide, 2500);
      pauseLabel.text("CLICK TO PAUSE");
    }
  });

  // size
  const sizeLegend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 40}, ${margin.top})`);

  sizeLegend.append("text")
    .attr("font-size", 12).attr("font-weight", "bold")
    .attr("fill", "#333").text("Social Level");

  [["Low", 1], ["Medium", 2], ["High", 3]].forEach(([label, val], i) => {
    const g = sizeLegend.append("g").attr("transform", `translate(0, ${40 + i * 26})`);
    g.append("circle").attr("r", z(val))
      .attr("fill", "#999").attr("fill-opacity", 0.4).attr("stroke", "#999");
    g.append("text").attr("x", 22).attr("dy", "0.35em")
      .attr("font-size", 11).attr("fill", "#555").text(label);
  });

  // color legend
  const colorLegend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 40}, ${margin.top + 110})`);

  colorLegend.append("text")
    .attr("font-size", 12).attr("font-weight", "bold")
    .attr("fill", "#333").text("Platform");

  Object.entries(platformColor).filter(([p]) => p !== "All").forEach(([platform, color], i) => {
    const g = colorLegend.append("g").attr("transform", `translate(0, ${40 + i * 24})`);
    g.append("circle").attr("r", 7).attr("fill", color).attr("fill-opacity", 0.8);
    g.append("text").attr("x", 14).attr("dy", "0.35em")
      .attr("font-size", 12).attr("fill", "#333").text(platform);
  });

  invalidation.then(() => {
    clearInterval(intervalId);
    tooltip.remove();
  });

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Teen_Mental_Health_Dataset.csv", {url: new URL("./files/beb4fdd3f77b7687883ca44c69d9bf49446fb27e5a7fba1320e911cc897fd2f7702ba349bfbb75df0c7482766fd66e99ce665a9a91a2965818b1385e9d8537f9.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("teen_mental_health_dataset")).define("teen_mental_health_dataset", ["__query","FileAttachment","invalidation"], _teen_mental_health_dataset);
  main.variable(observer("bubbleChart")).define("bubbleChart", ["FileAttachment","d3","invalidation"], _bubbleChart);
  return main;
}
