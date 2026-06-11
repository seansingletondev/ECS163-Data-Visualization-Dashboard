import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from "@mui/material";
import { typeColors, formatName } from "../utils/typeChart";

/**
 * mapping from stat keys to HTML descriptions.
 * These descriptions are shown when a stat is selected.
 */
const statDescriptions: Record<string, string> = {
  hp: "HP (<strong>Hit Points</strong>) determines how much damage a Pokémon can take before fainting.",
  attack: "Attack affects the power of <strong>physical moves</strong>.",
  defense: "Defense reduces damage from <strong>physical moves</strong>.",
  sp_atk: "Special Attack powers up <strong>special moves</strong>.",
  sp_def: "Special Defense reduces damage from <strong>special moves</strong>.",
  speed:
    "Speed determines which Pokémon <strong>moves first</strong> each turn.",
};

/**
 * key takeaways explaining the competitive relevance of each stat.
 */
const statTakeaways: Record<string, string> = {
  hp: "Bulky Pokémon with high HP are useful for stalling and tanking hits. Outliers like Blissey are specialize in their defensive role.",
  attack:
    "High Attack stats are key for physical sweepers and wallbreakers. Pokémon such as Mega Garchomp make for very good sweepers with an attack stat of 170.",
  defense:
    "Physically defensive Pokémon serve as walls against strong physical attackers. Great for pivoting and support roles. Mega Steelix excels at this with its staggering 230 defense making it a great waller against physical teams.",
  sp_atk:
    "Special Attack enables powerful ranged attacks. Useful for Pokémon like Alakazam which can counter pokemon with high defense but low special defenses.",
  sp_def:
    "High Special Defense allows Pokémon to counter special sweepers. Examples include Shuckle with a 230 Sp. Def.",
  speed:
    "Speed controls turn order and tempo. Fast Pokémon like Dragapult or Weavile can take their turn first against slower opponents.",
};

/** List of stat keys in toggle order */
const statKeys = Object.keys(statDescriptions);

/**
 * Type definition for a Pokémon's stat record.
 */
interface StatRecord {
  name: string;
  value: number;
  type1: string;
}

/**
 * Renders a histogram of stat distribution for Pokémon.
 * Allows users to toggle between base stats (HP, Attack, etc.)
 * and shows tooltips with Pokémon images and types.
 *
 * @component
 * @example
 * return <StatOverview />
 */
export default function StatOverview() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedStat, setSelectedStat] = useState("hp");

  /**
   * Loads CSV data and renders the histogram
   * Triggered on mount and when selectedStat changes.
   */
  useEffect(() => {
    const loadData = async () => {
      const data = await d3.csv("/data/pokmeon_competitive.csv");

      /** parsed data for the selected stat */
      const statData: StatRecord[] = data
        .map((d) => ({
          name: d["name"] || "Unknown",
          value: +d[selectedStat]!,
          type1: d["type1"] || "Unknown",
        }))
        .filter((d) => !isNaN(d.value));

      // Chart params
      const svg = d3.select(svgRef.current);
      const width = 800;
      const height = 400;
      const margin = { top: 20, right: 20, bottom: 40, left: 60 };

      svg.attr("width", width).attr("height", height);
      svg.selectAll("*").remove();

      // X scale for stat values
      const x = d3
        .scaleLinear()
        .domain(d3.extent(statData, (d) => d.value) as [number, number])
        .nice()
        .range([margin.left, width - margin.right]);

      // bin the data for histogram
      const bins = d3
        .bin<StatRecord, number>()
        .value((d) => d.value)
        .domain(x.domain() as [number, number])
        .thresholds(20)(statData);

      // y scale for count of Pokémon per bin
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(bins, (d) => d.length) || 1])
        .range([height - margin.bottom, margin.top]);

      // tooltip setup
      const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#222")
        .style("color", "white")
        .style("padding", "6px 8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("display", "none");

      // renders bar
      const barGroup = svg.append("g");
      const bars = barGroup.selectAll("rect").data(bins, (d: any) => d.x0);

      bars
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.x0!))
        .attr("y", y(0))
        .attr("width", (d) => Math.max(x(d.x1!) - x(d.x0!) - 1, 0))
        .attr("height", 0)
        .attr("fill", "#66bb6a")
        .merge(bars as any)
        .on("mouseover", (_, d) => {
          const maxPokemon = d.reduce(
            (prev, curr) => (curr.value > prev.value ? curr : prev),
            d[0]
          );
          const type = maxPokemon.type1;
          const color = typeColors[type.toLowerCase()] || "#aaa";
          const spriteUrl = formatName(maxPokemon.name);

          tooltip
            .style("display", "block")
            .style("border", `2px solid ${color}`)
            .html(
              `<strong style="color:${color}">${maxPokemon.name}</strong><br/>
               <img src='${spriteUrl}' width='40' height='40' /><br/>
               Type: <strong style="color:${color}">${type}</strong><br/>
               ${selectedStat.toUpperCase()}: ${maxPokemon.value}`
            );
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"))
        .transition()
        .duration(750)
        .attr("y", (d) => y(d.length))
        .attr("height", (d) => y(0) - y(d.length));

      bars
        .exit()
        .transition()
        .duration(500)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();

      // x-axis
      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Stat Value");

      // y-axis
      svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .append("text")
        .attr("x", -height / 2)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Pokémon");
    };

    loadData();
  }, [selectedStat]);

  return (
    <Box
      sx={{
        mt: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Title */}
      <Typography variant="h5" gutterBottom>
        Stat Distribution:{" "}
        {selectedStat === "sp_atk"
          ? "Sp. Atk"
          : selectedStat === "sp_def"
          ? "Sp. Def"
          : selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}
      </Typography>

      {/* Stat Explanation*/}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: "#1e1e1e", color: "white" }}>
        <Typography
          dangerouslySetInnerHTML={{ __html: statDescriptions[selectedStat] }}
        />
      </Paper>

      {/* Buttons for selecting stat */}
      <ToggleButtonGroup
        value={selectedStat}
        exclusive
        onChange={(_, value) => value && setSelectedStat(value)}
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        {statKeys.map((stat) => (
          <ToggleButton
            key={stat}
            value={stat}
            sx={{
              color: "white",
              borderColor: "white",
              "&.Mui-selected": { backgroundColor: "#66bb6a", color: "black" },
            }}
          >
            {stat === "sp_atk"
              ? "Sp. Atk"
              : stat === "sp_def"
              ? "Sp. Def"
              : stat.charAt(0).toUpperCase() + stat.slice(1)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/*histogram */}
      <svg ref={svgRef} style={{ display: "block", margin: "0 auto" }}></svg>

      {/* Key takeaway note */}
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper sx={{ p: 2, backgroundColor: "#2a2a2a", color: "white" }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Key Takeaway</strong>
          </Typography>
          <Typography>{statTakeaways[selectedStat]}</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
