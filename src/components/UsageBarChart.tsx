import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

/**
 * UsageBarChart renders a vertical bar chart showing the top 20 most-used Pokémon
 * for a selected year and format (Smogon or Worlds) based on a competitive dataset.
 *
 * - Pokémon are represented by bars with usage %.
 * - X-axis includes Pokémon names and corresponding sprites.
 * - Y-axis represents usage percentage.
 * - Users can filter the chart by format and year using Material UI components.
 *
 */
export default function UsageBarChart() {
  const usageNotes: Record<string, string> = {
    "Smogon-2022":
      "Hazard control and bulkier offense teams dominated the meta.",
    "Smogon-2023":
      "Paradox Pokémon and Terastalization shifted type priorities.",
    "Smogon-2024": "Heavy hitters and speed control ruled the tier.",
    "Worlds-2022": "Restricted Legendaries shaped powerful offensive cores.",
    "Worlds-2023": "Pivoting and redirection defined many top teams.",
    "Worlds-2024":
      "Speed control and disruption strategies were key to success.",
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const [year, setYear] = useState(2024);
  const [format, setFormat] = useState<"Smogon" | "Worlds">("Smogon");

  useEffect(() => {
    d3.csv("/data/top20_usage_per_year.csv", d3.autoType).then(
      (data: any[]) => {
        const filtered = data.filter(
          (d) => d.year === year && d.format === format
        );

        const svg = d3.select(svgRef.current);
        const container = svgRef.current?.parentElement;
        const width = container ? container.clientWidth : 800;
        const height = 600;
        const margin = { top: 20, right: 30, bottom: 140, left: 60 };

        svg.selectAll("*").remove();
        svg.attr("height", height);
        svg.style("background", "white");

        const x = d3
          .scaleBand()
          .domain(filtered.map((d) => d.name))
          .range([margin.left, width - margin.right])
          .padding(0.2);

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(filtered, (d) => d.usage) ?? 100])
          .nice()
          .range([height - margin.bottom, margin.top]);

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        // Bars with animation
        svg
          .selectAll("rect")
          .data(filtered, (d: any) => d.name)
          .enter()
          .append("rect")
          .attr("x", (d) => x(d.name)!)
          .attr("width", x.bandwidth())
          .attr("y", y(0))
          .attr("height", 0)
          .attr("fill", (d) => color(d.name))
          .transition()
          .duration(800)
          .attr("y", (d) => y(d.usage))
          .attr("height", (d) => y(0) - y(d.usage));
        // Usage % labels above bars
        svg
          .selectAll("text.usage-label")
          .data(filtered)
          .enter()
          .append("text")
          .attr("class", "usage-label")
          .attr("x", (d: any) => x(d.name)! + x.bandwidth() / 2)
          .attr("y", (d: any) => y(d.usage) - 8)
          .attr("text-anchor", "middle")
          .style("fill", "#000")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text((d: any) => `${d.usage.toFixed(1)}%`);

        // X-Axis
        const xAxis = svg
          .append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

        // Style x-axis labels
        xAxis
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .attr("text-anchor", "end")
          .attr("x", -5)
          .attr("y", 10)
          .style("font-size", "13px")
          .style("font-weight", "bold")
          .attr("fill", "#333");

        // Add Pokémon sprite under each label
        xAxis.selectAll("text").each(function (d: unknown) {
          const spriteNameMap: Record<string, string> = {
            // From original spriteNameMap
            "mewtwo-mega-x": "mewtwo-megax",
            "mewtwo-mega-y": "mewtwo-megay",
            "charizard-mega-x": "charizard-megax",
            "charizard-mega-y": "charizard-megay",
            "necrozma-dawn-wings": "necrozma-dawnwings",
            "necrozma-dusk-mane": "necrozma-duskmane",
            "keldeo-ordinary": "keldeo",
            "wormadam-plant": "wormadam",
            "wormadam-sandy": "wormadam-sandy",
            "wormadam-trash": "wormadam-trash",

            // From showdownNameMap
            "calyrex-shadow-rider": "calyrex-shadow",
            "calyrex-ice-rider": "calyrex-ice",
            "zacian-crowned": "zacian-crowned",
            "zamazenta-crowned": "zamazenta-crowned",
            "urshifu-rapid-strike": "urshifu-rapid-strike",
            "flutter mane": "fluttermane",
            "chien-pao": "chienpao",
            "samurott-hisui": "samurott-hisui",
            "landorus-therian": "landorus-therian",
            "landorus-incarnate": "landorus",
            "flutter-mane": "fluttermane",
            "tornadus-incarnate": "tornadus",
            "thundurus-incarnate": "thundurus",
            "raging-bolt": "ragingbolt",
            "urshifu-rapid": "urshifu-rapidstrike",
            "urshifu-single": "urshifu",
            "indeedee-female": "indeedee-f",
            "chi-yu": "chiyu",
            "iron-hands": "ironhands",
            "roaring-moon": "roaringmoon",
            "iron-bundle": "ironbundle",
            "ting-lu": "tinglu",
            "tatsugiri-curly": "tatsugiri",
          };

          const textNode = this as SVGTextElement;
          const group = d3.select(textNode.parentNode as SVGGElement);

          const rawName = (d as string).toLowerCase();
          const normalized =
            spriteNameMap[rawName] || rawName.replace(/[^a-z0-9-]/g, "");
          const spriteURL = `https://play.pokemonshowdown.com/sprites/gen5/${normalized}.png`;

          group
            .append("image")
            .attr("xlink:href", spriteURL)
            .attr("width", 50)
            .attr("height", 50)
            .attr("x", -23)
            .attr("y", -55);
        });

        // Y-Axis
        svg
          .append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .selectAll("text")
          .attr("fill", "#333");

        // X-Axis Label
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height - 10)
          .attr("text-anchor", "middle")
          .style("fill", "#333")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Pokémon");

        // Y-Axis Label
        svg
          .append("text")
          .attr("x", -height / 2)
          .attr("y", 15)
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "middle")
          .style("fill", "#333")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Usage (%)");

        const noteKey = `${format}-${year}`;
        const noteText = usageNotes[noteKey] || "";

        svg
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", margin.top + 10)
          .attr("text-anchor", "end")
          .style("fill", "#444")
          .style("font-size", "13px")
          .style("font-style", "italic")
          .style("font-weight", "400")
          .text(noteText);
      }
    );
  }, [year, format]);

  return (
    <Box
      sx={{
        mt: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: "100%",
      }}
    >
      <Typography variant="h5" align="center" gutterBottom sx={{ mb: 2 }}>
        Competitive Pokémon Usage ({format}, {year})
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: "white" }}>Year</InputLabel>
          <Select
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            label="Year"
            sx={{
              color: "white",
              backgroundColor: "#2f353f",
              borderColor: "#ccc",
              ".MuiOutlinedInput-notchedOutline": { borderColor: "#aaa" },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#fff",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#fff",
              },
              ".MuiSvgIcon-root": { color: "white" },
            }}
          >
            {[2022, 2023, 2024].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={format}
          exclusive
          onChange={(_, val) => val && setFormat(val)}
          sx={{
            backgroundColor: "#2f353f",
            borderRadius: 1,
            "& .MuiToggleButton-root": {
              color: "white",
              borderColor: "#999",
              "&.Mui-selected": {
                backgroundColor: "white",
                color: "#2f353f",
                fontWeight: "bold",
              },
            },
          }}
        >
          <ToggleButton value="Smogon">Smogon</ToggleButton>
          <ToggleButton value="Worlds">VGC (Worlds)</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{ p: 2 }}>
        <svg ref={svgRef} style={{ width: "100%", height: "600px" }}></svg>
      </Paper>
    </Box>
  );
}
