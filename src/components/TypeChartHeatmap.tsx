import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { types, typeChart } from "../utils/typeChart";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

const typeColors: Record<string, string> = {
  Normal: "#A8A878",
  Fire: "#F08030",
  Water: "#6890F0",
  Electric: "#F8D030",
  Grass: "#78C850",
  Ice: "#98D8D8",
  Fighting: "#C03028",
  Poison: "#A040A0",
  Ground: "#E0C068",
  Flying: "#A890F0",
  Psychic: "#F85888",
  Bug: "#A8B820",
  Rock: "#B8A038",
  Ghost: "#705898",
  Dragon: "#7038F8",
  Dark: "#705848",
  Steel: "#B8B8D0",
  Fairy: "#EE99AC",
  No_type: "#555555", // for monotypes or empty secondaries
};

/**
 * TypeChartHeatmap visualizes how effective each attacking type is against dual-type combinations
 * that include a selected primary type. It uses a heatmap grid to show damage multipliers
 * (e.g., 0×, 0.5×, 2×, 4×) across all secondary types paired with the primary type.
 *
 * Data is sourced from `pokmeon_competitive.csv` and the heatmap is computed dynamically.
 *
 * - Vertical axis = all secondary types paired with selected primary
 * - Horizontal axis = attacking types
 * - Cell color encodes effectiveness multiplier (e.g., blue = resistance, red = weakness)
 * - Labels show multipliers like "2", "½", or "0"
 *
 * This component includes smooth scrolling, responsive sizing, and Material UI dropdown interaction.
 */
export default function TypeChartHeatmap() {
  const ref = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /** Currently selected primary type for which the heatmap is generated */
  const [primaryType, setPrimaryType] = useState("Normal");

  /** Stores frequency of each [type1/type2] combination */
  const [comboCounts, setComboCounts] = useState<Record<string, number>>({});

  /**
   * Smooth scroll into view when the primary type changes
   */
  useEffect(() => {
    if (containerRef.current) {
      // delay scroll to ensure DOM height has adjusted
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        window.scrollBy(0, -100); // shift up slightly to prevent cutoff
      }, 200);
    }
  }, [primaryType]);

  /**
   * Redraw the heatmap whenever the selected primary type or combination counts change
   */
  useEffect(() => {
    d3.csv("/data/pokmeon_competitive.csv").then((data) => {
      const counts: Record<string, number> = {};
      data.forEach((d: any) => {
        const t1 = d.type1?.trim().toLowerCase();
        const t2 = d.type2?.trim().toLowerCase();
        if (!t1) return;
        const primary = capitalize(t1);
        const secondary =
          !t2 || t2 === "no_ability" || t2 === t1 ? "No_type" : capitalize(t2);
        const key = `${primary}/${secondary}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      setComboCounts(counts);
    });
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 600;
    const size = isMobile ? 24 : 36;
    const attackTypes = types;

    const matchingCombos = Object.entries(comboCounts)
      .filter(([key]) => key.startsWith(`${primaryType}/`))
      .map(([key, count]) => {
        const [, secondary] = key.split("/");
        return { secondary, count };
      });

    const width = (attackTypes.length + 1) * size;
    const height = matchingCombos.length * size;

    const svg = d3
      .select(ref.current)
      .attr("width", width + 280)
      .attr("height", height + 120);

    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", "translate(180,60)");

    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 0.5, 1, 2, 4])
      .range(["#ff2222", "#ff9999", "white", "#99cc99", "#009900"]);

    // Draw headers for Type1, Type2, Count
    const headers = [
      { label: "Type1", x: -180 },
      { label: "Type2", x: -115 },
      { label: "PKMN", x: -40 },
    ];

    headers.forEach(({ label, x }) => {
      g.append("rect")
        .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
        .attr("x", x - 4)
        .attr("y", -35)
        .attr("width", 64)
        .attr("height", 20)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "#777");

      g.append("text")
        .text(label.toUpperCase())
        .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
        .attr("x", x + 28)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .attr("alignment-baseline", "middle");
    });

    // === LEFT COLUMNS ===
    // Draw rows: primary type, secondary type, count
    g.selectAll(".primary-cell")
      .data(matchingCombos)
      .enter()
      .append("g")
      .each(function (_, i) {
        const group = d3.select(this);
        group
          .append("rect")
          .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
          .attr("x", -180)
          .attr("y", i * size)
          .attr("width", 60)
          .attr("height", size)
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", typeColors[primaryType]);

        group
          .append("text")
          .text(primaryType.substring(0, 3).toUpperCase())
          .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
          .attr("x", -150)
          .attr("y", i * size + size / 1.6)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("font-weight", "bold")
          .attr("fill", "white");
      });

    // SECONDARY TYPE BOX
    g.selectAll(".secondary-cell")
      .data(matchingCombos)
      .enter()
      .append("g")
      .each(function (d, i) {
        const color = typeColors[d.secondary] || "#777";
        const label =
          d.secondary === "No_type"
            ? "—"
            : d.secondary.substring(0, 3).toUpperCase();

        const group = d3.select(this);
        group
          .append("rect")
          .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
          .attr("x", -120)
          .attr("y", i * size)
          .attr("width", 60)
          .attr("height", size)
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", color);

        group
          .append("text")
          .text(label)
          .attr("x", -90)
          .attr("y", i * size + size / 1.6)
          .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("font-weight", "bold")
          .attr("fill", "white");
      });

    // PKMN COUNT BOX
    g.selectAll(".count-cell")
      .data(matchingCombos)
      .enter()
      .append("g")
      .each(function (d, i) {
        const group = d3.select(this);
        group
          .append("rect")
          .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
          .attr("x", -40)
          .attr("y", i * size)
          .attr("width", 40)
          .attr("height", size)
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", "#999");

        group
          .append("text")
          .text(d.count.toString())
          .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
          .attr("x", -20)
          .attr("y", i * size + size / 1.6)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("font-weight", "bold")
          .attr("fill", "white");
      });

    // === COLUMN HEADERS ===
    g.selectAll(".col-label-bg")
      .data(attackTypes)
      .enter()
      .append("rect")
      .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
      .attr("x", (_, i) => (i + 1) * size)
      .attr("y", -35)
      .attr("width", size)
      .attr("height", 20)
      .attr("fill", (d) => typeColors[d])
      .attr("rx", 4)
      .attr("ry", 4);

    g.selectAll(".col-label-text")
      .data(attackTypes)
      .enter()
      .append("text")
      .text((d) => d.substring(0, 3).toUpperCase())
      .attr("font-family", "Roboto, Helvetica, Arial, sans-serif")
      .attr("x", (_, i) => (i + 1) * size + size / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .attr("fill", "white");

    // === GRID DATA ===
    const cells = [];
    for (let atk of attackTypes) {
      for (let i = 0; i < matchingCombos.length; i++) {
        const { secondary } = matchingCombos[i];
        const def2 = secondary === "No_type" ? null : secondary;
        const m1 = typeChart[atk]?.[primaryType] ?? 1;
        const m2 = def2 ? typeChart[atk]?.[def2] ?? 1 : 1;
        const multiplier = m1 * m2;
        cells.push({ atk, secondary, row: i, multiplier });
      }
    }

    // === DRAW GRID CELLS ===
    g.selectAll("rect.cell")
      .data(cells)
      .enter()
      .append("rect")
      .attr("x", (d) => (types.indexOf(d.atk) + 1) * size)
      .attr("y", (d) => d.row * size)
      .attr("width", size)
      .attr("height", size)
      .attr("fill", (d) => colorScale(d.multiplier))
      .attr("stroke", "#444");

    // MULTIPLIER TEXT
    g.selectAll("text.multiplier")
      .data(cells)
      .enter()
      .append("text")
      .attr("x", (d) => (types.indexOf(d.atk) + 1) * size + size / 2)
      .attr("y", (d) => d.row * size + size / 1.6)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", (d) =>
        d.multiplier <= 0.5 || d.multiplier === 0 ? "white" : "#111"
      )
      .text((d) => {
        switch (d.multiplier) {
          case 0:
            return "0";
          case 0.5:
            return "½";
          case 1:
            return "";
          case 2:
            return "2";
          case 4:
            return "4";
          default:
            return d.multiplier.toFixed(2);
        }
      });
  }, [primaryType, comboCounts]);

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{ mb: 2, mt: 4 }}
      >
        Type Effectiveness Heatmap
      </Typography>

      <FormControl sx={{ minWidth: 220, marginBottom: 4 }}>
        <InputLabel sx={{ color: "white", fontSize: 11, fontWeight: "bold" }}>
          Primary Type
        </InputLabel>
        <Select
          value={primaryType}
          label="Primary Type"
          onChange={(e: SelectChangeEvent) => setPrimaryType(e.target.value)}
          sx={{
            color: "white",
            ".MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#fff",
            },
            ".MuiSvgIcon-root": { color: "white" },
          }}
        >
          {types.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div
        style={{
          overflowX: "auto",
          padding: "1rem",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg ref={ref}></svg>
      </div>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
