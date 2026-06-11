/**
 * @fileoverview RadarChartComparison.tsx
 * A comparison tool that visualizes base stat differences between two Pokémon using a D3-powered radar chart.
 * It includes auto-scaling, sprite previews, autocompletion, and smooth transitions for stat polygons.
 */

import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { csv } from "d3-fetch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

/** Pokémon base stats in display order */
const statOrder = ["hp", "attack", "defense", "speed", "sp_def", "sp_atk"];
const axisLabels = ["HP", "Attack", "Defense", "Speed", "Sp. Def", "Sp. Atk"];
const defaultMax = 160;
const csvPath = "public/data/pokmeon_competitive.csv";
import pokeball from "../assets/sprites/pokeball.png";

/** Mapping from type names to their corresponding color */
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

interface Pokemon {
  name: string;
  [key: string]: string | number;
}

/**
 * @function getShowdownSpriteName
 * Maps a Pokémon name to the proper Pokémon Showdown sprite name.
 * Handles special forms and aliases.
 *
 * @param {string} name - Pokémon name
 * @returns {string} - Correct sprite file name or fallback transformation
 */
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
  };
  const rawName = name.toLowerCase();
  return spriteNameMap[rawName] || rawName.replace(/[^a-z0-9-]/g, "");
}

/**
 * @component RadarChartComparison
 * Displays a radar chart comparing two Pokémon's base stats.
 * Includes auto-complete search bars, Pokémon sprites, and animated polygon transitions.
 *
 * @returns {JSX.Element}
 */
export default function RadarChartComparison() {
  const [data, setData] = useState<Pokemon[]>([]);
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null);
  const [maxValue, setMaxValue] = useState<number>(defaultMax);
  const chartRef = useRef<SVGSVGElement | null>(null);

  const [pokemon1Input, setPokemon1Input] = useState("");
  const [pokemon2Input, setPokemon2Input] = useState("");
  const [pokemon1Selected, setPokemon1Selected] = useState(false);
  const [pokemon2Selected, setPokemon2Selected] = useState(false);

  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 30;
  const centerX = width / 2;
  const centerY = height / 2;
  const angleSlice = (Math.PI * 2) / statOrder.length;

  useEffect(() => {
    csv(csvPath, (d) => {
      const parsed: Pokemon = { name: d.name };
      statOrder.forEach((key) => {
        parsed[key] = +d[key];
      });
      return parsed;
    }).then(setData);
  }, []);

  useEffect(() => {
    const candidates = [pokemon1, pokemon2].filter(Boolean) as Pokemon[];
    const allStats = candidates.flatMap((pkmn) =>
      statOrder.map((k) => pkmn[k] as number),
    );
    const maxStat = allStats.length ? Math.max(...allStats) : 0;
    setMaxValue(Math.max(defaultMax, maxStat));
  }, [pokemon1, pokemon2]);

  // Initial static drawing of axes, labels, and empty polygons
  useEffect(() => {
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    svg.attr("width", width).attr("height", height);
    const group = svg
      .append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    for (let lvl = 1; lvl <= 5; lvl++) {
      const r = (radius * lvl) / 5;
      const points = statOrder.map((_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return [r * Math.cos(angle), r * Math.sin(angle)];
      });
      group
        .append("polygon")
        .attr("points", points.map((p) => p.join(",")).join(" "))
        .attr("stroke", "#ccc")
        .attr("fill", "none");
    }

    statOrder.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      group
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#999");
      group
        .append("text")
        .attr("x", x * 1.1)
        .attr("y", y * 1.1)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .text(axisLabels[i]);
    });

    // Append polygons with IDs for later updating
    group
      .append("polygon")
      .attr("id", "pokemon1Poly")
      .attr("fill", "#0096FF")
      .attr("stroke", "#0096FF")
      .attr("opacity", 0.5)
      .attr(
        "points",
        Array(statOrder.length)
          .fill([0, 0])
          .map((p) => p.join(","))
          .join(" "),
      ); // start collapsed

    group
      .append("polygon")
      .attr("id", "pokemon2Poly")
      .attr("fill", "#FF2400")
      .attr("stroke", "#FF2400")
      .attr("opacity", 0.5)
      .attr(
        "points",
        Array(statOrder.length)
          .fill([0, 0])
          .map((p) => p.join(","))
          .join(" "),
      ); // start collapsed
  }, []);

  // Animate polygons smoothly including appearing/disappearing by morphing points
  useEffect(() => {
    const svg = d3.select(chartRef.current);
    const group = svg.select("g");

    const transition = d3.transition().duration(600).ease(d3.easeCubicOut);

    // Points collapsed at center (for no data)
    const centerPoints = Array(statOrder.length)
      .fill([0, 0])
      .map((p) => p.join(","))
      .join(" ");

    const makePoints = (pokemon: Pokemon | null) => {
      if (!pokemon) return centerPoints;
      return statOrder
        .map((key, i) => {
          const value = pokemon[key] as number;
          const scaled = (value / maxValue) * radius;
          const angle = angleSlice * i - Math.PI / 2;
          return [scaled * Math.cos(angle), scaled * Math.sin(angle)];
        })
        .map((p) => p.join(","))
        .join(" ");
    };

    group
      .select("#pokemon1Poly")
      .transition(transition)
      .attr("points", makePoints(pokemon1));

    group
      .select("#pokemon2Poly")
      .transition(transition)
      .attr("points", makePoints(pokemon2));
  }, [pokemon1, pokemon2, maxValue]);

  const getSuggestions = (input: string) => {
    if (!input) return [];
    const lower = input.toLowerCase();
    // Changed from startsWith to includes for substring match anywhere in the name
    return data.filter((p) => p.name.toLowerCase().includes(lower));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: 16,
      }}
    >
      {/* Title */}
      <Typography variant="h6" gutterBottom sx={{ textAlign: "center" }}>
        Pokémon Stat Comparison Tool
      </Typography>
      {/* Row with the two search bars centered above the radar chart */}
      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          width: 600,
        }}
      >
        {/* Pokemon 1 Search + Sprite */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: 180,
            flexShrink: 0,
            marginLeft: 32, // This accounts for the sprite adding virtual length to the viewer
          }}
        >
          <span className="color-label" style={{ color: "#0096FF" }}>
            ⬤
          </span>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pokémon 1"
            value={
              pokemon1Input.charAt(0).toUpperCase() + pokemon1Input.slice(1)
            }
            onChange={(e) => {
              const value = e.target.value;
              setPokemon1Input(value);
              setPokemon1Selected(false);
              const match = data.find(
                (p) => p.name.toLowerCase() === value.toLowerCase(),
              );
              setPokemon1(match || null);
            }}
            onBlur={() => setTimeout(() => setPokemon1Selected(true), 200)}
            autoComplete="off"
            sx={{
              backgroundColor: "white",
              width: "100%",
              boxSizing: "border-box",
              paddingRight: 0,
            }}
          />
          <img
            src={
              pokemon1
                ? `https://play.pokemonshowdown.com/sprites/gen5/${getShowdownSpriteName(
                    pokemon1.name,
                  )}.png`
                : pokeball
            }
            alt={pokemon1 ? pokemon1.name : "Pokeball"}
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = pokeball;
            }}
          />
          {!pokemon1Selected && getSuggestions(pokemon1Input).length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "150px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                maxHeight: 150,
                overflowY: "auto",
                backgroundColor: "white",
                zIndex: 10,
                borderRadius: 4,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {getSuggestions(pokemon1Input).map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: "6px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    fontWeight: "bold",
                    color: typeColors[p.type1] || "#000",
                  }}
                  onMouseDown={() => {
                    setPokemon1(p);
                    setPokemon1Input(p.name);
                    setPokemon1Selected(true);
                  }}
                >
                  {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pokemon 2 Search + Sprite */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: 180,
            flexShrink: 0,
            marginLeft: 32, // This accounts for the sprite adding virtual length to the viewer
          }}
        >
          <span className="color-label" style={{ color: "#FF2400" }}>
            ⬤
          </span>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Pokémon 2"
            value={
              pokemon2Input.charAt(0).toUpperCase() + pokemon2Input.slice(1)
            }
            onChange={(e) => {
              const value = e.target.value;
              setPokemon2Input(value);
              setPokemon2Selected(false);
              const match = data.find(
                (p) => p.name.toLowerCase() === value.toLowerCase(),
              );
              setPokemon2(match || null);
            }}
            onBlur={() => setTimeout(() => setPokemon2Selected(true), 200)}
            autoComplete="off"
            sx={{
              backgroundColor: "white",
              width: "100%",
              boxSizing: "border-box",
              paddingRight: 0,
            }}
          />
          <img
            src={
              pokemon2
                ? `https://play.pokemonshowdown.com/sprites/gen5/${getShowdownSpriteName(
                    pokemon2.name,
                  )}.png`
                : pokeball
            }
            alt={pokemon2 ? pokemon2.name : "Pokeball"}
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = pokeball;
            }}
          />
          {!pokemon2Selected && getSuggestions(pokemon2Input).length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "150px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                maxHeight: 150,
                overflowY: "auto",
                backgroundColor: "white",
                zIndex: 10,
                borderRadius: 4,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {getSuggestions(pokemon2Input).map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: "6px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    fontWeight: "bold",
                    color: typeColors[p.type1] || "#000",
                  }}
                  onMouseDown={() => {
                    setPokemon2(p);
                    setPokemon2Input(p.name);
                    setPokemon2Selected(true);
                  }}
                >
                  {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Radar Chart style box (white paper) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 8,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "fit-content",
        }}
      >
        <svg ref={chartRef} width={300} height={300} />
      </div>
    </div>
  );
}
