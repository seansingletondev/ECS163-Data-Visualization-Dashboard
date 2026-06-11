import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Typography, Button } from "@mui/material";
import { typeColors, formatName } from "../utils/typeChart";

interface PokemonType {
  name: string;
  primary: string;
  secondary: string | null;
}

export default function TypeDistribution() {
  const svgRef = useRef<SVGSVGElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [typeData, setTypeData] = useState<Record<string, PokemonType[]>>({});
  const [activePrimary, setActivePrimary] = useState<string | null>(null);
  const [activeSecondaryView, setActiveSecondaryView] = useState(false);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(
    null,
  );

  const scrollToTop = () => {
    if (topRef.current) {
      const yOffset = -200;
      const y =
        topRef.current.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Load CSV and parse types into a map of primary types to Pokémon
  useEffect(() => {
    d3.csv("/data/pokmeon_competitive.csv").then((data) => {
      const typeMap: Record<string, PokemonType[]> = {};
      Object.keys(typeColors).forEach((type) => {
        typeMap[type] = [];
      });

      // data parsing for dataset
      data.forEach((d: any) => {
        const name = d.name?.toLowerCase() || "";
        const primary = d.type1?.toLowerCase() || "unknown";
        const secondary =
          !d.type2 || d.type2.trim() === "" ? null : d.type2.toLowerCase();

        // In pokemon, mimikyu has totem sprites to mimic certain characters which is why this is in the filter
        // In addition, zygarde was repeated in certain instances which needed to be fixed
        if (
          name.includes("zygarde-10%-power-construct") ||
          name.includes("zygarde-50%-power-construct") ||
          name.includes("-totem")
        )
          return;

        if (typeMap[primary]) {
          typeMap[primary].push({ name, primary, secondary });
        }
      });

      setTypeData(typeMap);
    });
  }, []);

  // Scroll to top when returning to overview
  useEffect(() => {
    if (!activePrimary) scrollToTop();
  }, [activePrimary]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // chart params
    const margin = { top: 30, right: 60, bottom: 70, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get types to display based on state
    const types = activePrimary
      ? [activePrimary]
      : Object.keys(typeData).filter((t) => t !== "no_type");

    const x = d3.scaleBand().domain(types).range([0, width]).padding(0.2);
    const maxCount = Math.max(...types.map((type) => typeData[type].length));
    const y = d3.scaleLinear().domain([0, maxCount]).range([height, 0]);

    // Draw X and Y axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "white");

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "white");

    // Add X axis label
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 15)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Primary Type");

    // Add Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Pokémon");

    // Render bars and handles click event behaviors
    types.forEach((type) => {
      const total = typeData[type].length;
      const secondaryCounts: Record<string, number> = {};
      typeData[type].forEach((p) => {
        const sec = p.secondary || "no_type";
        secondaryCounts[sec] = (secondaryCounts[sec] || 0) + 1;
      });

      let currentY = total;
      const xPos = x(type)!;
      const barGroup = g.append("g").style("cursor", "pointer");

      if (
        activePrimary === type &&
        !activeSecondaryView &&
        !selectedSecondary
      ) {
        //stacked bars by secondary type
        Object.entries(secondaryCounts)
          .sort((a, b) => b[1] - a[1])
          .forEach(([secType, count]) => {
            const start = currentY - count;
            const segment = barGroup
              .append("rect")
              .attr("x", xPos)
              .attr("y", y(currentY))
              .attr("width", x.bandwidth())
              .attr("height", 0)
              .attr(
                "fill",
                secType === "no_type"
                  ? typeColors[type]
                  : typeColors[secType] || "#aaa",
              )

              .attr("opacity", 0.9)
              .on("click", (event) => {
                event.stopPropagation();
                setSelectedSecondary(secType);
                setActiveSecondaryView(true);
              })
              .on("mouseover", function () {
                d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
              })
              .on("mouseout", function () {
                d3.select(this).attr("stroke", "none");
              });
            // Add tooltip for secondary type
            segment
              .append("title")
              .text(
                `${type}-${secType === "no_type" ? "only" : secType}: ${count} Pokémon`,
              );
            segment
              .transition()
              .duration(600)
              .attr("y", y(currentY))
              .attr("height", y(start) - y(currentY));
            currentY = start;
          });
      } else if (!activePrimary) {
        // Overview mode: single bar per primary type
        barGroup
          .append("rect")
          .attr("x", xPos)
          .attr("y", y(total))
          .attr("width", x.bandwidth())
          .attr("height", 0)
          .attr("fill", typeColors[type])
          .on("mouseover", function () {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
          })
          .on("mouseout", function () {
            d3.select(this).attr("stroke", "none");
          })
          .transition()
          .duration(600)
          .attr("height", height - y(total));
      }
      // Click event for drill-down and back navigation
      barGroup
        .on("click", () => {
          if (!activePrimary) {
            setActivePrimary(type);
            setActiveSecondaryView(false);
            setSelectedSecondary(null);
            scrollToTop();
          } else if (activePrimary === type && !activeSecondaryView) {
            setActiveSecondaryView(true);
            scrollToTop();
          } else {
            setSelectedSecondary(null);
            setActivePrimary(null);
            setActiveSecondaryView(false);
          }
        })
        .append("title")
        .text(`${type}: ${total} Pokémon`);
    });

    // Legend for stacked bars (secondary types)
    if (activePrimary && !activeSecondaryView && !selectedSecondary) {
      const legendData = Object.entries(typeColors).filter(
        ([type]) => type !== "no_type",
      );
      const legendItemHeight = 18;
      const legendItemWidth = 100;
      const legendCols = 2;
      const legendX = width - legendItemWidth * legendCols + 115;
      const legendY = 20;
      const legendTitleHeight = 25;

      g.append("rect")
        .attr("x", legendX - 10)
        .attr("y", legendY - 20)
        .attr("width", legendItemWidth * legendCols + 20)
        .attr(
          "height",
          Math.ceil(legendData.length / legendCols) * legendItemHeight +
            legendTitleHeight,
        )
        .attr("fill", "#1a1f2c")
        .attr("opacity", 0.85)
        .attr("rx", 6);

      g.append("text")
        .attr("x", legendX + (legendItemWidth * legendCols) / 2 - 30)
        .attr("y", legendY - 10)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Secondary Type");

      legendData.forEach(([type, color], i) => {
        const col = i % legendCols;
        const row = Math.floor(i / legendCols);
        const group = g
          .append("g")
          .attr(
            "transform",
            `translate(${legendX + col * legendItemWidth}, ${
              legendY + row * legendItemHeight
            })`,
          );

        group
          .append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color);

        group
          .append("text")
          .attr("x", 16)
          .attr("y", 10)
          .style("fill", "white")
          .style("font-size", "11px")
          .text(type.charAt(0).toUpperCase() + type.slice(1));
      });
    }
  }, [typeData, activePrimary, activeSecondaryView, selectedSecondary]);

  return (
    <Box
      ref={topRef}
      sx={{ mt: 6, display: "flex", flexDirection: "column", width: "100%" }}
    >
      <Typography variant="h5" align="center" gutterBottom sx={{ mb: 2 }}>
        Type Distribution Bar Chart
      </Typography>

      {/* Hide bar chart when viewing filtered Pokémon list */}
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          display:
            activePrimary && (activeSecondaryView || selectedSecondary)
              ? "none"
              : "block",
        }}
      >
        <svg ref={svgRef} style={{ display: "block", margin: "0 auto" }}></svg>
      </div>

      {/*Pokémon display */}
      {activePrimary && activeSecondaryView && (
        <Box sx={{ mt: 4, px: 4 }}>
          <Typography variant="h6" align="center" gutterBottom>
            Pokémon with Primary Type:{" "}
            {activePrimary.charAt(0).toUpperCase() + activePrimary.slice(1)}
            {selectedSecondary
              ? ` and Secondary Type: ${
                  selectedSecondary.charAt(0).toUpperCase() +
                  selectedSecondary.slice(1)
                }`
              : ""}
          </Typography>
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedSecondary(null);
                setActiveSecondaryView(false);
              }}
            >
              ← Go Back
            </Button>
          </Box>
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setActivePrimary(null);
                setActiveSecondaryView(false);
                setSelectedSecondary(null);
              }}
            >
              ← Back to Overview
            </Button>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 2,
              mt: 2,
            }}
          >
            {typeData[activePrimary]
              .filter((p) =>
                selectedSecondary ? p.secondary === selectedSecondary : true,
              )
              .map((p, i) => (
                <Box
                  key={i}
                  sx={{
                    textAlign: "center",
                    transition: "transform 0.2s ease",
                    "&:hover": { transform: "scale(1.05)" },
                  }}
                >
                  <img
                    src={formatName(p.name.toLowerCase())}
                    alt={p.name}
                    style={{ width: 48, height: 48 }}
                  />
                  <Typography variant="body2">{p.name}</Typography>
                </Box>
              ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
