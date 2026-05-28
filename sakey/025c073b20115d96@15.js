function _1(md){return(
md`# sakey diagram`
)}

function _teen_mental_health_dataset(__query,FileAttachment,invalidation){return(
__query(FileAttachment("Teen_Mental_Health_Dataset.csv"),{from:{table:"Teen_Mental_Health_Dataset"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

async function _chart2(require,FileAttachment,d3,invalidation)
{
  // i need to load sankey and the dataset first
  const sk = await require("d3-sankey@0.12/dist/d3-sankey.min.js");
  const data = await FileAttachment("Teen_Mental_Health_Dataset.csv").csv({ typed: true });

  // i'm binning screen time before sleep into 3 categories
  function screenCat(v) {
    if (v < 1) return "Low Screen Time";
    if (v <= 2) return "Medium Screen Time";
    return "High Screen Time";
  }

  // same for sleep hours
  function sleepCat(v) {
    if (v < 6) return "Low Sleep hours";
    if (v <= 7.5) return "Medium Sleep hours";
    return "High Sleep hours";
  }

  // and physical activity
  function physCat(v) {
    if (v < 0.7) return "Low Physical activity";
    if (v <= 1.3) return "Medium Physical activity";
    return "High Physical activity";
  }

  // counting how many teens are in each flow
  const linkCounts = {};
  for (const row of data) {
    const sc = screenCat(row.screen_time_before_sleep);
    const sl = sleepCat(row.sleep_hours);
    const ph = physCat(row.physical_activity);
    const k1 = sc + "||" + sl;
    const k2 = sl + "||" + ph;
    linkCounts[k1] = (linkCounts[k1] || 0) + 1;
    linkCounts[k2] = (linkCounts[k2] || 0) + 1;
  }

  const nodeNames = [
    "Low Screen Time", "Medium Screen Time", "High Screen Time",
    "Low Sleep hours", "Medium Sleep hours", "High Sleep hours",
    "Low Physical activity", "Medium Physical activity", "High Physical activity",
  ];

  // two-line labels for each node
  const nodeLabels = {
    "Low Screen Time":          "Low Screen Time\n< 1 hour",
    "Medium Screen Time":       "Medium Screen Time\n1–2 hours",
    "High Screen Time":         "High Screen Time\n> 2 hours",
    "Low Sleep hours":          "Low Sleep hours\n< 6 hours",
    "Medium Sleep hours":       "Medium Sleep hours\n6–7.5 hours",
    "High Sleep hours":         "High Sleep hours\n> 7.5 hours",
    "Low Physical activity":    "Low Physical activity\n< 0.7",
    "Medium Physical activity": "Medium Physical activity\n0.7–1.3",
    "High Physical activity":   "High Physical activity\n> 1.5",
  };

  // i picked these colors to match the low/med/high theme
  const nodeColor = {
    "Low Screen Time":          "#4a7c59",
    "Medium Screen Time":       "#4a6fa5",
    "High Screen Time":         "#c0404a",
    "Low Sleep hours":          "#4a7c59",
    "Medium Sleep hours":       "#4a6fa5",
    "High Sleep hours":         "#c0404a",
    "Low Physical activity":    "#4a6fa5",
    "Medium Physical activity": "#b5945a",
    "High Physical activity":   "#4a7c59",
  };

  const idOf = Object.fromEntries(nodeNames.map((name, i) => [name, i]));
  const graphNodes = nodeNames.map((name, i) => ({ id: i, name }));

  // all the connections i want to show
  const linkDefs = [
    ["Low Screen Time",    "Low Sleep hours"],
    ["Low Screen Time",    "Medium Sleep hours"],
    ["Low Screen Time",    "High Sleep hours"],
    ["Medium Screen Time", "Low Sleep hours"],
    ["Medium Screen Time", "Medium Sleep hours"],
    ["Medium Screen Time", "High Sleep hours"],
    ["High Screen Time",   "Low Sleep hours"],
    ["High Screen Time",   "Medium Sleep hours"],
    ["High Screen Time",   "High Sleep hours"],
    ["Low Sleep hours",    "Low Physical activity"],
    ["Low Sleep hours",    "Medium Physical activity"],
    ["Low Sleep hours",    "High Physical activity"],
    ["Medium Sleep hours", "Low Physical activity"],
    ["Medium Sleep hours", "Medium Physical activity"],
    ["Medium Sleep hours", "High Physical activity"],
    ["High Sleep hours",   "Low Physical activity"],
    ["High Sleep hours",   "Medium Physical activity"],
    ["High Sleep hours",   "High Physical activity"],
  ];

  const graphLinks = linkDefs.map(([src, tgt]) => ({
    source: idOf[src],
    target: idOf[tgt],
    value: linkCounts[src + "||" + tgt] || 0,
  }));

  const width = 1200;
  const height = 700;
  const margin = { top: 30, right: 220, bottom: 30, left: 220 };

  const sankeyFn = sk.sankey || sk.default?.sankey || sk;
  const linkPath = sk.sankeyLinkHorizontal || sk.default?.sankeyLinkHorizontal;

  const sankeyGen = sankeyFn()
    .nodeId(d => d.id)
    .nodeWidth(18)
    .nodePadding(28)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

  const graph = sankeyGen({
    nodes: graphNodes.map(d => ({ ...d })),
    links: graphLinks.map(d => ({ ...d })),
  });

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "sans-serif")
    .style("background", "#fff");

  // drawing the flow paths
  const linkPaths = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(graph.links)
    .join("path")
      .attr("d", linkPath())
      .attr("stroke", d => nodeColor[d.source.name] || "#aaa")
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke-opacity", 0.4)
      .style("cursor", "pointer");

  // drawing the node rectangles
  const nodeRects = svg.append("g")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => nodeColor[d.name] || "#999")
      .attr("rx", 2)
      .style("cursor", "grab");

  // i'm redrawing labels after every drag so they stay in place
  const labelGroup = svg.append("g");

  function drawLabels() {
    labelGroup.selectAll("text").remove();
    labelGroup.selectAll("text")
      .data(graph.nodes)
      .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x0 - 10 : d.x1 + 10)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "end" : "start")
        .each(function(d) {
          const lines = nodeLabels[d.name].split("\n");
          const el = d3.select(this);
          el.text(null);
          lines.forEach((line, i) => {
            el.append("tspan")
              .attr("x", d.x0 < width / 2 ? d.x0 - 10 : d.x1 + 10)
              .attr("dy", i === 0 ? `-${(lines.length - 1) * 0.6}em` : "1.2em")
              .attr("font-size", i === 0 ? 13 : 12)
              .attr("font-weight", i === 0 ? "bold" : "normal")
              .attr("fill", i === 0 ? "#222" : "#555")
              .text(line);
          });
        });
  }

  drawLabels();

  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "13px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  let selectedNode = null;

  // hovering a path highlights just that one
  linkPaths
    .on("mouseover", function(event, d) {
      if (selectedNode) return;
      linkPaths.attr("stroke-opacity", l => l === d ? 0.75 : 0.08);
      tooltip.style("opacity", 1)
        .html(`<strong>${d.source.name}</strong> → <strong>${d.target.name}</strong><br/>${d.value} teens`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      if (selectedNode) return;
      linkPaths.attr("stroke-opacity", 0.4);
      tooltip.style("opacity", 0);
    });

  // hovering a node shows how many teens flow through it
  nodeRects
    .on("mouseover", function(event, d) {
      if (selectedNode) return;
      d3.select(this).attr("opacity", 0.8);
      const total = graph.links
        .filter(l => l.source.name === d.name || l.target.name === d.name)
        .reduce((sum, l) => sum + l.value, 0) / 2;
      tooltip.style("opacity", 1)
        .html(`<strong>${d.name}</strong><br/>${Math.round(total)} teens<br/><em>Click to isolate</em>`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      if (selectedNode) return;
      d3.select(this).attr("opacity", 1);
      tooltip.style("opacity", 0);
    });

  // clicking a node isolates its links so it's easier to read
  nodeRects.on("click", function(event, d) {
    event.stopPropagation();
    event.preventDefault();

    if (selectedNode && selectedNode.name === d.name) {
      selectedNode = null;
      linkPaths.attr("stroke-opacity", 0.4);
      nodeRects.attr("opacity", 1);
      tooltip.style("opacity", 0);
      return;
    }

    selectedNode = d;

    linkPaths.attr("stroke-opacity", l =>
      (l.source.name === d.name || l.target.name === d.name) ? 0.75 : 0.06
    );
    nodeRects.attr("opacity", n => {
      const connected = graph.links.some(l =>
        (l.source.name === d.name && l.target.name === n.name) ||
        (l.target.name === d.name && l.source.name === n.name) ||
        n.name === d.name
      );
      return connected ? 1 : 0.25;
    });

    tooltip.style("opacity", 1)
      .style("left", (event.pageX + 14) + "px")
      .style("top", (event.pageY - 28) + "px")
      .html(`<strong>${d.name}</strong><br/>Click again to deselect`);
  });

  // clicking the background resets everything
  svg.on("click", function(event) {
    if (event.target === this) {
      selectedNode = null;
      linkPaths.attr("stroke-opacity", 0.4);
      nodeRects.attr("opacity", 1);
      tooltip.style("opacity", 0);
    }
  });

  // i added drag so you can reposition nodes vertically
  nodeRects.call(
    d3.drag()
      .on("start", function() {
        d3.select(this).style("cursor", "grabbing");
      })
      .on("drag", function(event, d) {
        const nodeHeight = d.y1 - d.y0;
        d.y0 = Math.max(margin.top, Math.min(height - margin.bottom - nodeHeight, d.y0 + event.dy));
        d.y1 = d.y0 + nodeHeight;
        d3.select(this).attr("y", d.y0);
        sankeyGen.update(graph);
        linkPaths.attr("d", linkPath());
        drawLabels();
      })
      .on("end", function() {
        d3.select(this).style("cursor", "grab");
      })
  );

  invalidation.then(() => tooltip.remove());

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
  main.variable(observer("chart2")).define("chart2", ["require","FileAttachment","d3","invalidation"], _chart2);
  return main;
}
