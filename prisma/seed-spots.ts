import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPOTS = [
  // Downtown / McGill area
  { name: "Café Olimpico", type: "cafe", neighborhood: "Mile End", schools: ["McGill University", "Université de Montréal"], description: "Classic Mile End espresso bar — unpretentious and always buzzing." },
  { name: "Crew Café", type: "cafe", neighborhood: "Old Montreal", schools: ["McGill University", "Concordia University"], description: "Beautiful heritage space, great coffee, relaxed vibe." },
  { name: "Parc La Fontaine", type: "park", neighborhood: "Plateau", schools: ["McGill University", "Concordia University", "Université de Montréal", "Cégep du Vieux Montréal"], description: "Picnic-friendly park with a pond. Perfect low-pressure first meet." },
  { name: "Tommy Café", type: "cafe", neighborhood: "Downtown", schools: ["McGill University", "Concordia University", "Dawson College"], description: "Bright, airy café in the heart of downtown." },
  { name: "Pikolo Espresso Bar", type: "cafe", neighborhood: "Downtown", schools: ["McGill University", "Concordia University", "Dawson College"], description: "Tiny, cozy espresso spot near Peel metro." },
  { name: "Marché Jean-Talon", type: "food", neighborhood: "Little Italy", schools: ["McGill University", "Université de Montréal", "Collège Ahuntsic", "Collège de Bois-de-Boulogne"], description: "Wander the market, grab pastries, people-watch." },

  // Concordia / SGW area
  { name: "Café Dei Campi", type: "cafe", neighborhood: "Downtown", schools: ["Concordia University", "Dawson College", "McGill University"], description: "Small Italian café, perfect for a quick first coffee." },
  { name: "Burgundy Lion", type: "bar", neighborhood: "Little Burgundy", schools: ["Concordia University", "Dawson College"], description: "Cozy pub with great food. Good for evening first hangs." },

  // Dawson / Vanier area
  { name: "Café Saint-Henri", type: "cafe", neighborhood: "NDG", schools: ["Dawson College", "Marianopolis College", "Concordia University"], description: "Specialty coffee in a clean, calm space." },
  { name: "Monkland Avenue Walk", type: "park", neighborhood: "NDG", schools: ["Dawson College", "Marianopolis College", "Collège Jean-de-Brébeuf"], description: "Stroll down Monkland, stop for ice cream or a bite." },

  // John Abbott area (West Island)
  { name: "Beaconsfield Boardwalk", type: "park", neighborhood: "West Island", schools: ["John Abbott College"], description: "Waterfront boardwalk — quiet, scenic, no pressure." },
  { name: "Brûlerie de Café de Ste-Anne", type: "cafe", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Village café near campus. Laid-back and familiar." },
  { name: "Ste-Anne-de-Bellevue Boardwalk", type: "park", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Charming waterfront walk right by campus." },

  // Vanier area
  { name: "Bar à Beurre", type: "cafe", neighborhood: "Saint-Laurent", schools: ["Vanier College", "Collège de Bois-de-Boulogne"], description: "Pastry-forward café with great lattes." },

  // UdeM / HEC / Poly area
  { name: "Café Expression", type: "cafe", neighborhood: "Côte-des-Neiges", schools: ["Université de Montréal", "HEC Montréal", "Polytechnique Montréal", "Collège Jean-de-Brébeuf"], description: "Neighborhood café near campus. Chill and familiar." },
  { name: "Beaver Lake (Mount Royal)", type: "park", neighborhood: "Mount Royal", schools: ["Université de Montréal", "HEC Montréal", "McGill University", "Concordia University"], description: "Walk up the mountain, enjoy the view. Classic Montréal." },

  // UQAM / Vieux Montréal
  { name: "Café Parvis", type: "cafe", neighborhood: "Quartier Latin", schools: ["Université du Québec à Montréal (UQAM)", "Cégep du Vieux Montréal"], description: "Modern café with a sunny terrace in the Quartier Latin." },
  { name: "Place Jacques-Cartier", type: "park", neighborhood: "Old Montreal", schools: ["Université du Québec à Montréal (UQAM)", "Cégep du Vieux Montréal", "McGill University"], description: "People-watch in Old Montreal. Always alive." },

  // South Shore
  { name: "Café Touski", type: "cafe", neighborhood: "Longueuil", schools: ["Champlain College Saint-Lambert", "Cégep Édouard-Montpetit"], description: "Artsy café with good vibes. Easy transit access." },
  { name: "Promenade René-Lévesque", type: "park", neighborhood: "Longueuil", schools: ["Champlain College Saint-Lambert", "Cégep Édouard-Montpetit"], description: "Riverside walk with city views across the water." },

  // Laval
  { name: "Centropolis", type: "food", neighborhood: "Laval", schools: ["Collège Montmorency"], description: "Lots of restaurants and terrace options. Easy to pick a spot." },

  // Fallback / universal
  { name: "Mont-Royal Avenue", type: "park", neighborhood: "Plateau", schools: ["McGill University", "Concordia University", "Université de Montréal", "Dawson College"], description: "Walk the Plateau's main drag. Coffee, shops, vibes." },
  { name: "Canal Lachine", type: "park", neighborhood: "Griffintown", schools: ["McGill University", "Concordia University", "Dawson College", "Vanier College"], description: "Walk or bike along the canal. Relaxed and scenic." },
];

async function main() {
  console.log("Seeding meeting spots...");

  for (const spot of SPOTS) {
    await prisma.meetingSpot.create({ data: spot });
  }

  console.log(`Seeded ${SPOTS.length} meeting spots.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
