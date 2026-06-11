import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { Typography, Button, TextField, Box } from "@mui/material";
import { types, weaknessResistanceChart } from "../utils/defensiveTypeChart";
import pokeball from "../assets/sprites/pokeball.png";

// Color mapping for Pokémon types (used for visual consistency)
// Currently only pulling the type strings, still required for current design

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
  No_type: "#555555",
};

const presetTeams: string[][] = [
  [
    "Gastrodon-east",
    "calyrex-shadow-rider",
    "Rillaboom",
    "Incineroar",
    "Thundurus-Incarnate",
    "Zacian",
  ],
  [
    "landorus-therian",
    "urshifu-single",
    "Flutter-mane",
    "Chien-Pao",
    "Amoonguss",
    "Arcanine",
  ],
  [
    "Miraidon",
    "Ogerpon-teal",
    "Urshifu-single",
    "Iron-Hands",
    "Whimsicott",
    "Farigiraf",
  ],
  [
    "Dragonite",
    "Landorus-therian",
    "Volcanion",
    "Weavile",
    "Magnezone",
    "Tapu-Lele",
  ],
  ["Samurott-Hisui", "Ceruledge", "Skeledirge", "Pawmot", "Garchomp", "Scizor"],
  [
    "Samurott-Hisui",
    "Landorus-Therian",
    "Kingambit",
    "Darkrai",
    "Zamazenta",
    "Glimmora",
  ],
];

const presetTitles: string[] = [
  "2022 VGC",
  "2023 VGC",
  "2024 VGC",
  "2022 Smogon ",
  "2023 Smogon ",
  "2024 Smogon",
];

interface Pokemon {
  name: string;
  type1: string;
  type2: string; // To simplify logic, No_type in data is treated as a valid backend magic type that has no properties on the resistance chart
  // other fields you might add
}

const filteredTypes = types.filter((t) => t !== "No_type"); // NEW
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Used later to fix names from data set -> fetching sprites, same method as previous components
function getShowdownSpriteName(name: string): string {
  const spriteNameMap: Record<string, string> = {
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

    // more edits to pngs
    "squawkabilly-yellow-plumage": "squawkabilly-yellow",
    "squawkabilly-blue-plumage": "squawkabilly-blue",
    "squawkabilly-green-plumage": "squawkabilly",
    squawkabilly: "squawkabilly-white",
    "maushold-three": "maushold",
    "dudunsparce-two-segment": "dudunsparce",
    "gumshoos-totem": "gumshoos",
    "meloetta-aria": "meloetta",
    "porygon-z": "porygonz",
    "marowak-totem": "marowak",
    "iron-moth": "ironmoth",
    "gouging-fire": "gougingfire",
    "basculin-blue-striped": "basculin-bluestriped",
    "basculin-white-striped": "basculin-whitestriped",
    "greninja-battle-bond": "greninja",
    "araquanid-totem": "araquanid",
    "tapu-fini": "tapufini",
    "basculegion-male": "basculegion",
    "basculegion-female": "basculegion-f",
    "palafin-zero": "palafin-hero",
    "walking-wake": "walkingwake",
    "ho-oh": "hooh",
    "pikachu-rock-star": "pikachu-rockstar",
    "pikachu-pop-star": "pikachu-popstar",
    "pikachu-original-cap": "pikachu-original",
    "pikachu-hoenn-cap": "pikachu-hoenn",
    "pikachu-sinnoh-cap": "pikachu-sinnoh",
    "pikachu-unova-cap": "pikachu-unova",
    "pikachu-kalos-cap": "pikachu-kalos",
    "pikachu-alola-cap": "pikachu-alola",
    "pikachu-partner-cap": "pikachu-partner",
    "pikachu-world-cap": "pikachu-world",
    "oricorio-pom-pom": "oricorio",
    "togedemaru-totem": "togedemaru",
    "tapu-koko": "tapukoko",
    "tapu-bulu": "tapubulu",
    "tapu-lele": "tapulele",
    "toxtricity-amped": "toxtricity",
    "toxtricity-low-key": "toxtricity-lowkey",
    "toxtricity-amped-gmax": "toxtricity-gmax",
    "toxtricity-low-key-gmax":
      "https://archives.bulbagarden.net/media/upload/thumb/a/a9/HOME0849Gi.png/200px-HOME0849Gi.png",
    "sandy-shocks": "sandyshocks",
    "miraidon-low-power-mode": "miraidon",
    "miraidon-drive-mode": "miraidon",
    "miraidon-aquatic-mode": "miraidon",
    "miraidon-glide-mode": "miraidon",
    "morpeko-full-belly": "morpeko",
    morpeko: "morpeko-hangry",
    "shaymin-land": "shaymin",
    "lurantis-totem": "lurantis",
    "ogerpon-teal": "ogerpon",
    "brute-bonnet": "brutebonnet",
    "iron-leaves": "ironleaves",
    "mr-mime-galar": "mrmime-galar",
    "darmanitan-galar-zen": "darmanitan-galarzen",
    "mr-rime": "mrrime",
    "tauros-paldea-combat": "tauros-paldeacombat",
    "tauros-paldea-blaze": "tauros-paldeablaze",
    "tauros-paldea-aqua": "tauros-paldeaaqua",
    "koraidon-limited-build": "koraidon",
    "koraidon-sprinting-build": "koraidon",
    "koraidon-swimming-build": "koraidon",
    "koraidon-gliding-build": "koraidon",
    "urshifu-single-strike-gmax": "urshifu-gmax",
    "urshifu-rapid-strike-gmax": "urshifu-rapidstrikegmax",
    "salazzle-totem": "salazzle",
    "great-tusk": "greattusk",
    "iron-treads": "irontreads",
    "mr-mime": "mrmime",
    "deoxys-normal": "deoxys",
    "mime-jr": "mimejr",
    "meowstic-male": "meowstic",
    "meowstic-female": "meowstic-f",
    "indeedee-male": "indeedee",
    "ribombee-totem": "ribombee",
    "vikavolt-totem": "vikavolt",
    "slither-wing": "slitherwing",
    "rockruff-own-tempo": "rockruff",
    "minior-orange-meteor": "minior-meteor",
    "minior-yellow-meteor": "minior-meteor",
    "minior-green-meteor": "minior-meteor",
    "minior-blue-meteor": "minior-meteor",
    "minior-indigo-meteor": "minior-meteor",
    "minior-violet-meteor": "minior-meteor",
    "iron-thorns": "ironthorns",
    "iron-boulder": "ironboulder",
    "mimikyu-totem-disguised": "mimikyu",
    "mimikyu-totem-busted": "mimikyu-busted",
    "zygarde-50": "zygarde",
    "zygarde-10%-power-construct": "zygarde-10",
    "zygarde-50%-power-construct": "zygarde",
    "hakamo-o": "hakamoo",
    "kommo-o": "kommoo",
    "kommo-o-totem": "kommoo",
    zygarde: "zygarde-complete",
    "iron-jugulis": "ironjugulis",
    "wo-chien": "wochien",
    "iron-crown": "ironcrown",
    "scream-tail": "screamtail",
    "iron-valiant": "ironvaliant",
    "enamorus-incarnate": "enamorus",
    "type-null": "typenull",
    "calyrex-shadow": "calyrex-shadow",
  };
  const rawName = name.toLowerCase();
  return spriteNameMap[rawName] || rawName.replace(/[^a-z0-9-]/g, "");
}

// Fixing Type Capitalization!
function fixTypeCapitalization(type: string): string {
  const lower = type.toLowerCase();
  if (lower === "no_type") return "No_type";
  const fixed = lower.charAt(0).toUpperCase() + lower.slice(1);
  return Object.keys(typeColors).includes(fixed) ? fixed : "No_type";
}

function getDefensiveProfile(types: string[]): Record<string, number> {
  const profile: Record<string, number> = {};

  for (const atkType in weaknessResistanceChart) {
    profile[atkType] = 1;
  }

  types.forEach((defType) => {
    const chart = weaknessResistanceChart[defType];
    if (!chart) return;
    for (const atkType in chart) {
      profile[atkType] *= chart[atkType];
    }
  });

  return profile;
}

function calculateNetDefensiveSpread(team: Pokemon[]): Record<string, number> {
  const spread: Record<string, number> = {};

  for (const type in weaknessResistanceChart) {
    spread[type] = 0;
  }

  team.forEach((member) => {
    if (!member || !member.name) return;

    const types = [member.type1, member.type2].filter(Boolean);
    const profile = getDefensiveProfile(types);

    for (const [atkType, multiplier] of Object.entries(profile)) {
      if (multiplier === 0) {
        spread[atkType] -= 1;
      } else if (multiplier < 1) {
        spread[atkType] -= 1;
      } else if (multiplier > 1) {
        spread[atkType] += 1;
      }
    }
  });

  return spread;
}

/**
 * The TeamBuilderBarChart component enables users to build a Pokémon team of six
 * and visualizes their collective net weaknesses and resistances by type.
 *
 * It uses D3.js to render a double-sided bar chart where:
 * - Positive values = team weaknesses to a type
 * - Negative values = team resistances to a type
 *
 * Users can search and add Pokémon, use preset teams, sort the chart, and remove members.
 */
export default function TeamBuilderBarChart() {
  /**
   * Current team of six Pokémon (or null if empty slot)
   */
  const [team, setTeam] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  /**
   * Complete Pokémon dataset loaded from CSV
   */
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);

  /**
   * User's current search input for Pokémon name
   */
  const [searchName, setSearchName] = useState("");

  /**
   * List of Pokémon suggestions based on current search input
   */
  const [suggestions, setSuggestions] = useState<Pokemon[]>([]);

  /**
   * Counts how many times each type appears across the current team
   */
  const initialTypeCounts: Record<string, number> = Object.fromEntries(
    Object.keys(typeColors).map((type) => [type, 0]),
  );
  const [, setTypeCounts] = useState<Record<string, number>>(initialTypeCounts);
  /**
   * Stores the net defensive spread of the team (resistance/weakness profile)
   */
  const [netDefensiveSpread, setNetDefensiveSpread] = useState<
    Record<string, number>
  >(Object.fromEntries(Object.keys(typeColors).map((type) => [type, 0])));

  /**
   * Backup of user's original team when a preset team is loaded
   */
  const [savedTeam, setSavedTeam] = useState<(string | null)[] | null>(null);

  /**
   * Whether the user is currently using a preset team
   */
  const [isUsingPreset, setIsUsingPreset] = useState(false);

  /**
   * Whether the bar chart is currently sorted by net weakness values
   */
  const [isSorted, setIsSorted] = useState(false);

  /**
   * Order of types currently shown on the X-axis (default or sorted)
   */
  const [currentTypeOrder, setCurrentTypeOrder] = useState<string[]>([
    ...filteredTypes,
  ]);

  /**
   * Loads a preset team into the team array and saves the current one if needed
   */
  const loadPresetTeam = (teamList: string[]) => {
    if (!isUsingPreset) {
      setSavedTeam([...team]);
      setIsUsingPreset(true);
    }

    const resolvedTeam = teamList.map((name) => {
      const found = pokemonData.find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      return found ? found.name : null;
    });

    if (resolvedTeam.some((p) => p === null)) {
      alert("One or more Pokémon not found in dataset!");
      return;
    }

    setTeam(resolvedTeam);
  };

  /**
   * Loads the Pokémon CSV and parses it for team builder usage
   */
  useEffect(() => {
    d3.csv("/data/pokmeon_competitive.csv").then((data) => {
      const parsedData: Pokemon[] = data
        .map((row) => ({
          name: row.name || "",
          type1: fixTypeCapitalization(row.type1),
          type2: fixTypeCapitalization(row.type2 || "No_type"),
        }))
        .filter(
          (p) =>
            !p.name.includes("zygarde-10%-power-construct") &&
            !p.name.includes("zygarde-50%-power-construct") &&
            !p.name.includes("-totem"),
        );

      setPokemonData(parsedData);
    });
  }, []);

  // Update type counts whenever the team changes
  useEffect(() => {
    const newCounts: Record<string, number> = { ...initialTypeCounts };

    team.forEach((name) => {
      if (!name) return;
      const pokemon = pokemonData.find((p) => p.name === name);
      if (!pokemon) return;

      newCounts[pokemon.type1] += 1;
      if (pokemon.type2 !== "No_type" && pokemon.type2 !== pokemon.type1) {
        newCounts[pokemon.type2] += 1;
      }
    });

    setTypeCounts(newCounts);
  }, [team, pokemonData]);

  // Prepping the chart
  useEffect(() => {
    const teamPokemon = team
      .map((name) => pokemonData.find((p) => p.name === name))
      .filter(Boolean) as Pokemon[];
    const spread = calculateNetDefensiveSpread(teamPokemon);
    setNetDefensiveSpread(spread);
  }, [team, pokemonData]);

  // FINAL STEP: 2) Compute sorted type order when netDefensiveSpread or team changes or sorting toggled
  useEffect(() => {
    if (isSorted) {
      // Sort types descending by net defensive value
      const sorted = [...filteredTypes].sort(
        (a, b) => (netDefensiveSpread[b] || 0) - (netDefensiveSpread[a] || 0),
      );
      setCurrentTypeOrder(sorted);
    } else {
      // Reset to original type order
      setCurrentTypeOrder([...filteredTypes]);
    }
  }, [isSorted, netDefensiveSpread]);

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchName(value);

    if (value.length === 0) {
      setSuggestions([]);
      return;
    }

    // Filter pokemonData for names matching the input (case insensitive)
    const filteredSuggestions = pokemonData.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(value.toLowerCase()),
    );
    setSuggestions(filteredSuggestions);
  };

  // Add selected Pokémon to first empty slot in team
  const addPokemonToTeam = (pokemonName: string) => {
    const firstEmptyIndex = team.findIndex((slot) => slot === null);
    if (firstEmptyIndex !== -1) {
      const newTeam = [...team];
      newTeam[firstEmptyIndex] = pokemonName;
      setTeam(newTeam);
    }
    setSearchName("");
    setSuggestions([]);
  };

  // Remove Pokémon from team slot
  const removePokemonFromTeam = (index: number) => {
    const newTeam = [...team];
    newTeam[index] = null;
    setTeam(newTeam);
  };

  // FINAL STEP: 3) Toggle sorting when user clicks button
  const toggleSort = () => {
    setIsSorted((prev) => !prev);
  };

  const svgRef = useRef<SVGSVGElement>(null);

  // Dimensions & margins for chart
  const margin = { top: 10, right: 10, bottom: 10, left: 40 };
  const width = 700 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Effect: render/update the bar chart whenever netDefensiveSpread or currentTypeOrder changes
  // 1) Setup SVG, axes, baseline, tooltip container only once on mount
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear everything once on mount

    const g = svg
      .append("g")
      .attr("class", "container")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand<string>()
      .domain(types)
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear().domain([6, -6]).range([0, height]);

    // Save scales on svg node for reuse later (hacky but minimal)
    (svg.node() as any).xScale = xScale;
    (svg.node() as any).yScale = yScale;

    // Y Axis
    const yAxis = d3.axisLeft(yScale).tickValues(d3.range(-6, 7)); // show all values -6 to 6
    const yAxisGroup = g.append("g").attr("class", "y-axis").call(yAxis);

    // Style Y axis to be black
    yAxisGroup.selectAll("path, line").attr("stroke", "black");
    yAxisGroup.selectAll("text").attr("fill", "black");

    // Add Y axis labels: Weaknesses (top), Resistances (bottom)
    g.append("text")
      .attr("class", "y-label-top")
      .attr("transform", `rotate(-90)`)
      .attr("x", -height / 4)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "14px")
      .text("Weaknesses");

    g.append("text")
      .attr("class", "y-label-bottom")
      .attr("transform", `rotate(-90)`)
      .attr("x", (-3 * height) / 4)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "14px")
      .text("Resistances");

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${yScale(0)})`)
      .call(xAxis);

    // Style X axis to be black
    xAxisGroup.selectAll("path, line").attr("stroke", "black");
    xAxisGroup
      .selectAll("text")
      .attr("transform", "rotate(-90)") // make vertical
      .attr("dx", "-0.8em")
      .attr("dy", "-0.4em")
      .style("text-anchor", "end")
      .attr("fill", "black");

    // Baseline line y=0
    g.append("line")
      .attr("class", "baseline")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    // Create tooltip div once
    d3.select("body")
      .append("div")
      .attr("class", "tooltip-bar-chart")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("border-radius", "4px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Cleanup tooltip on unmount
    return () => {
      d3.select(".tooltip-bar-chart").remove();
    };
  }, []); // run only once on mount

  // 2) Update bars when data or order changes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g.container");
    if (g.empty()) return;

    // Retrieve scales saved on svg node
    const xScale: d3.ScaleBand<string> = (svg.node() as any).xScale;
    const yScale: d3.ScaleLinear<number, number> = (svg.node() as any).yScale;

    // Update domain of xScale with currentTypeOrder
    xScale.domain(currentTypeOrder);

    // Update X axis to reflect new order
    const xAxis = d3.axisBottom(xScale);
    const xAxisSelection = g.select<SVGGElement>(".x-axis");

    // Call axis generator immediately on selection (no transition)
    xAxisSelection.call(xAxis);

    // Then animate tick labels separately with transition
    xAxisSelection
      .selectAll("text")
      .transition()
      .duration(600)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "end");

    // Prepare data array for bars
    const barData = currentTypeOrder.map((type) => ({
      type,
      value: netDefensiveSpread[type] || 0,
    }));

    // Select tooltip div
    const tooltip = d3.select(".tooltip-bar-chart");

    // Bind data to bars
    const bars = g
      .selectAll<SVGRectElement, (typeof barData)[0]>(".bar")
      .data(barData, (d) => d.type);

    // Exit old bars
    bars
      .exit()
      .transition()
      .duration(500)
      .attr("height", 0)
      .attr("y", yScale(0))
      .remove();

    // Enter new bars
    const barsEnter = bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.type)!)
      .attr("width", xScale.bandwidth())
      .attr("y", yScale(0))
      .attr("height", 0)
      .attr("fill", (d) =>
        d.value > 0 ? "crimson" : d.value < 0 ? "steelblue" : "gray",
      )
      .attr("opacity", 0.85)
      .on("mouseover", (_, d) => {
        tooltip.style("opacity", 1).html(`
                    <strong>${d.type}</strong><br/>
                    ${
                      d.value > 0
                        ? `Weaknesses: +${d.value}`
                        : d.value < 0
                          ? `Resistances: ${-d.value}`
                          : "Neutral"
                    }
                `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Merge enter + update selection
    barsEnter
      .merge(bars)
      .transition()
      .duration(800)
      .attr("x", (d) => xScale(d.type)!)
      .attr("width", xScale.bandwidth())
      .attr("y", (d) => (d.value >= 0 ? yScale(d.value) : yScale(0)))
      .attr("height", (d) => Math.abs(yScale(d.value) - yScale(0)))
      .attr("fill", (d) =>
        d.value > 0 ? "crimson" : d.value < 0 ? "steelblue" : "gray",
      );
  }, [netDefensiveSpread, currentTypeOrder]);

  // Render / Return Zone //
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "30px",
        margin: "20px",
        alignItems: "flex-start",
      }}
    >
      {/* LEFT SIDE: Team Builder */}
      <div style={{ flex: 1, minWidth: "320px" }}>
        <Typography variant="h6" gutterBottom>
          Team Builder
        </Typography>

        {/* Wrap input + suggestions in relative container */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <TextField
            label="Add a Pokémon!"
            variant="outlined"
            size="small"
            value={searchName}
            onChange={handleSearchChange}
            autoComplete="off"
            sx={{ backgroundColor: "white", width: "60%" }}
          />
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "60%",
                border: "1px solid #ccc",
                maxHeight: "150px",
                overflowY: "auto",
                backgroundColor: "white",
                zIndex: 10,
                borderRadius: 4,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {suggestions.map((pokemon) => (
                <div
                  key={pokemon.name}
                  style={{
                    padding: "6px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    fontWeight: "bold",
                    color: typeColors[pokemon.type1] || "#000",
                  }}
                  onClick={() => addPokemonToTeam(pokemon.name)}
                >
                  {capitalize(pokemon.name)} ({pokemon.type1}
                  {pokemon.type2 !== "No_type" ? ` / ${pokemon.type2}` : ""})
                </div>
              ))}
            </div>
          )}
        </div>

        <Typography variant="subtitle1" gutterBottom>
          Your Team
        </Typography>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            minHeight: "150px",
          }}
        >
          {team.map((name, i) => {
            const poke = pokemonData.find((p) => p.name === name);
            return (
              <div
                key={i}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  minWidth: "72px",
                  textAlign: "center",
                  userSelect: "none",
                  cursor: name ? "pointer" : "default",
                  color: name
                    ? typeColors[poke?.type1 || "No_type"] || "#000"
                    : "#888",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={() => name && removePokemonFromTeam(i)}
                title={name ? "Click to remove" : ""}
              >
                {poke ? (
                  <img
                    src={`https://play.pokemonshowdown.com/sprites/gen5/${getShowdownSpriteName(
                      poke.name,
                    )}.png`}
                    alt={poke.name}
                    style={{ width: 72, height: 72, objectFit: "contain" }}
                    loading="lazy"
                  />
                ) : (
                  <img
                    src={pokeball} // The sole sprite import
                    alt="Empty slot"
                    style={{ width: 72, height: 72, objectFit: "contain" }}
                    loading="lazy"
                  />
                )}
                {/* {name ? capitalize(name) : `Member ${i + 1}`}
                                    ADDING THE NAMES STRETCHED THE BOX, commented out in case you want to future style */}
              </div>
            );
          })}
        </div>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, mb: 2 }}>
          {presetTitles.map((title, idx) => (
            <Button
              key={idx}
              size="small"
              variant="outlined"
              onClick={() => loadPresetTeam(presetTeams[idx])}
              sx={{
                whiteSpace: "nowrap",
                textTransform: "none",
                fontSize: "0.75rem",
                borderColor: "#aaa",
                color: "#fff",
                backgroundColor: "#444",
                "&:hover": {
                  backgroundColor: "#666",
                },
              }}
            >
              {title}
            </Button>
          ))}

          {isUsingPreset && savedTeam && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setTeam(savedTeam);
                setSavedTeam(null);
                setIsUsingPreset(false);
              }}
              sx={{
                whiteSpace: "nowrap",
                textTransform: "none",
                fontSize: "0.75rem",
                borderColor: "#aaa",
                color: "#fff",
                backgroundColor: "#888",
                "&:hover": {
                  backgroundColor: "#aaa",
                },
              }}
            >
              Return to My Team
            </Button>
          )}
        </Box>
      </div>

      {/* RIGHT SIDE: Double-sided Bar Chart */}
      <div style={{ flex: 2, position: "relative" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ textAlign: "center", userSelect: "none" }}
        >
          Team Weakness/Resistance Calculator
        </Typography>
        <Button
          variant="outlined"
          onClick={toggleSort}
          size="small"
          sx={{ marginBottom: 1 }}
        >
          {isSorted
            ? "Switch to Default Sort"
            : "Switch to Sort by Net Weakness"}
        </Button>

        <svg
          ref={svgRef}
          width={width + margin.left + margin.right}
          height={height + margin.top + margin.bottom}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
          aria-label="Team Defensive Type Spread Bar Chart"
          role="img"
        />
      </div>
    </div>
  );
}
