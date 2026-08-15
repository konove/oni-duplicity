/**
 * Game object group names of the critters the editor will list.
 *
 * Collected from real saves by looking for prefabs carrying a `CreatureBrain`
 * behavior, across base game, Spaced Out!, Frosty Planet and Prehistoric
 * Planet colonies. Eggs are deliberately excluded - they are separate prefabs
 * without a brain, and are not creatures to edit.
 *
 * Not exhaustive: a critter no colony here has ever hatched is missing, and
 * the Aquatic Planet Pack is unrepresented. Adding a name is safe; the list
 * only decides what appears on the creatures page.
 */
export const CREATURE_GAMEOBJECT_TYPES = [
  "Bee",
  "BeeBaby",
  "BeeHive",
  "Butterfly",
  "Chameleon",
  "ChameleonBaby",
  "Crab",
  "CrabBaby",
  "DivergentBeetle",
  "DivergentBeetleBaby",
  "DivergentWorm",
  "Drecko",
  "DreckoBaby",
  "DreckoPlastic",
  "DreckoPlasticBaby",
  "Hatch",
  "HatchBaby",
  "HatchHard",
  "HatchHardBaby",
  "HatchVeggie",
  "IceBelly",
  "LightBug",
  "LightBugBaby",
  "Mole",
  "MoleBaby",
  "MoleDelicacy",
  "Moo",
  "Mosquito",
  "MosquitoBaby",
  "Oilfloater",
  "OilfloaterHighTemp",
  "Pacu",
  "PacuBaby",
  "PacuCleaner",
  "PacuTropical",
  "PacuTropicalBaby",
  "PrehistoricPacu",
  "PufferFish",
  "Puft",
  "PuftAlpha",
  "PuftAlphaBaby",
  "PuftBaby",
  "PuftBleachstone",
  "PuftOxylite",
  "Raptor",
  "Snail",
  "Squirrel",
  "SquirrelBaby",
  "Staterpillar",
  "StaterpillarBaby",
  "Stego",
  "WoodDeer",
];
