import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPOTS = [
  // ── Dawson College ──
  { name: "Café Myriade", type: "cafe", neighborhood: "Downtown", schools: ["Dawson College", "Concordia University", "McGill University", "TAV College", "Collège LaSalle"], description: "Super aesthetic coffee shop, perfect first date energy." },
  { name: "Time Out Market Montreal", type: "food", neighborhood: "Downtown", schools: ["Dawson College", "Concordia University", "McGill University", "Collège LaSalle"], description: "Multiple food options, low pressure decision-making." },
  { name: "Atwater Market", type: "park", neighborhood: "Atwater", schools: ["Dawson College", "Concordia University", "TAV College"], description: "Elite summer date spot — walking, snacks, and flowers." },
  { name: "Anticafé Montreal", type: "cafe", neighborhood: "Downtown", schools: ["Dawson College", "Concordia University", "McGill University"], description: "Pay by time, cozy, good if convo-heavy." },
  { name: "Shaughnessy Café", type: "cafe", neighborhood: "Downtown", schools: ["Dawson College", "Concordia University", "TAV College"], description: "Known Dawson and Concordia student haunt, natural first meetup." },
  { name: "Atwater Cocktail Club", type: "bar", neighborhood: "Atwater", schools: ["Dawson College", "Concordia University"], description: "Intimate speakeasy-style, better for evening dates." },
  { name: "bonap at Alexis Nihon", type: "food", neighborhood: "Atwater", schools: ["Dawson College", "Marianopolis College"], description: "Trendy food hall near Dawson, low-pressure and convenient." },

  // ── Vanier College ──
  { name: "Café Milano", type: "cafe", neighborhood: "Saint-Laurent", schools: ["Vanier College", "Cégep de Saint-Laurent"], description: "Chill Italian café, classic safe date." },
  { name: "Place Vertu", type: "food", neighborhood: "Saint-Laurent", schools: ["Vanier College", "Cégep de Saint-Laurent"], description: "Basic but practical, food court dates still work." },
  { name: "Parc Bois-Franc", type: "park", neighborhood: "Saint-Laurent", schools: ["Vanier College"], description: "Underrated peaceful walk date." },
  { name: "Lily – Manger Vivre Aimer", type: "cafe", neighborhood: "Saint-Laurent", schools: ["Vanier College"], description: "Calm, beautiful, inviting — ideal soft first date." },
  { name: "Pigeon Café & Bar", type: "cafe", neighborhood: "Saint-Laurent", schools: ["Vanier College"], description: "Stylish and cozy, brunch/coffee energy, cute date choice." },
  { name: "Chez Céramique Bistro", type: "cafe", neighborhood: "Saint-Laurent", schools: ["Vanier College"], description: "Pottery + bistro — built-in activity, explicitly a first-date place." },

  // ── John Abbott College ──
  { name: "Ste-Anne-de-Bellevue Canal Boardwalk", type: "park", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Can carry the entire app for Abbott on its own." },
  { name: "Mango Bay", type: "bar", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Waterfront + drinks = elite." },
  { name: "Café TWIGS", type: "cafe", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Cozy + student vibe." },
  { name: "Olé Tapas", type: "food", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Right in Ste-Anne, waterfront/date-night energy." },
  { name: "Violet Angel", type: "food", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Boardwalk area, pairs well with a canal walk first." },
  { name: "Marché Ste-Anne", type: "food", neighborhood: "Ste-Anne-de-Bellevue", schools: ["John Abbott College"], description: "Great for daytime/Saturday dates, local-produce stroll-around." },

  // ── Marianopolis College ──
  { name: "Westmount Park", type: "park", neighborhood: "Westmount", schools: ["Marianopolis College"], description: "Quiet, safe, perfect for soft dates." },
  { name: "Café Bazin", type: "cafe", neighborhood: "Westmount", schools: ["Marianopolis College"], description: "Brunch date = elite positioning." },
  { name: "Victoria Village", type: "park", neighborhood: "Westmount", schools: ["Marianopolis College"], description: "Walk + shop + coffee combo." },
  { name: "Café Olimpico Westmount", type: "cafe", neighborhood: "Westmount", schools: ["Marianopolis College"], description: "Right on Victoria Ave, polished but approachable." },
  { name: "Café Myriade Westmount", type: "cafe", neighborhood: "Westmount", schools: ["Marianopolis College"], description: "Known Montreal coffee name, refined first-date energy." },
  { name: "Café Gentile Westmount", type: "cafe", neighborhood: "Westmount", schools: ["Marianopolis College"], description: "Polished Sicilian-inspired hospitality." },

  // ── McGill University ──
  { name: "Café Osmo", type: "cafe", neighborhood: "Downtown", schools: ["McGill University", "Concordia University", "O'Sullivan College"], description: "Clean, minimal, very McGill-coded first date." },
  { name: "Tommy Café", type: "cafe", neighborhood: "Downtown", schools: ["McGill University", "Concordia University", "Dawson College"], description: "Slightly extra, very aesthetic, high impression date." },
  { name: "Mount Royal Lookout", type: "park", neighborhood: "Mount Royal", schools: ["McGill University", "Concordia University", "Université de Montréal", "HEC Montréal", "O'Sullivan College"], description: "Top-tier move — sunset carries the whole date." },
  { name: "Milton B", type: "cafe", neighborhood: "Downtown", schools: ["McGill University"], description: "Quiet, cozy, very easy first meet." },
  { name: "Japote", type: "food", neighborhood: "Downtown", schools: ["McGill University", "Concordia University"], description: "Casual but fun, lowers pressure." },

  // ── Concordia University ──
  { name: "Crew Collective & Café", type: "cafe", neighborhood: "Old Montreal", schools: ["Concordia University", "McGill University"], description: "One of the best date interiors in Montreal." },
  { name: "Café Saint-Henri", type: "cafe", neighborhood: "Downtown", schools: ["Concordia University", "Dawson College", "McGill University", "O'Sullivan College"], description: "Reliable, clean, modern." },
  { name: "Lachine Canal", type: "park", neighborhood: "Griffintown", schools: ["Concordia University", "Dawson College", "McGill University"], description: "Walk + coffee combo = elite." },
  { name: "Restaurant Grinder", type: "food", neighborhood: "Downtown", schools: ["Concordia University", "McGill University"], description: "Slightly upscale, good for confident users." },
  { name: "Arthurs Nosh Bar", type: "food", neighborhood: "Downtown", schools: ["Concordia University", "McGill University", "Dawson College"], description: "Brunch date monster." },

  // ── Université de Montréal ──
  { name: "Café Bloom", type: "cafe", neighborhood: "Outremont", schools: ["Université de Montréal", "HEC Montréal", "Polytechnique Montréal", "Collège Jean-de-Brébeuf"], description: "Soft, pretty, very date-friendly." },
  { name: "Parc Tiohtià:ke", type: "park", neighborhood: "Outremont", schools: ["Université de Montréal", "HEC Montréal", "Polytechnique Montréal"], description: "Underrated, peaceful, great convo setting." },
  { name: "Café des Amis", type: "cafe", neighborhood: "Côte-des-Neiges", schools: ["Université de Montréal", "HEC Montréal", "Polytechnique Montréal"], description: "Small, cozy, low pressure." },
  { name: "Bernice", type: "cafe", neighborhood: "Outremont", schools: ["Université de Montréal", "HEC Montréal"], description: "Cute brunch/dessert vibe." },
  { name: "Sushi Sama", type: "food", neighborhood: "Côte-des-Neiges", schools: ["Université de Montréal", "Polytechnique Montréal"], description: "Casual but still a date feel." },

  // ── HEC Montréal ──
  { name: "Café Névé", type: "cafe", neighborhood: "Outremont", schools: ["HEC Montréal", "Université de Montréal"], description: "Clean + slightly upscale coffee vibe." },
  { name: "Pâtisserie Rhubarbe", type: "cafe", neighborhood: "Outremont", schools: ["HEC Montréal", "Université de Montréal", "Collège Jean-de-Brébeuf"], description: "Dessert date = strong play." },
  { name: "Mount Royal Park (Outremont side)", type: "park", neighborhood: "Outremont", schools: ["HEC Montréal", "Université de Montréal", "Polytechnique Montréal"], description: "Nature + walk = simple but effective." },
  { name: "Mamie Clafoutis", type: "cafe", neighborhood: "Outremont", schools: ["HEC Montréal", "Université de Montréal"], description: "Bakery date, relaxed but nice." },

  // ── Polytechnique Montréal ──
  { name: "Café Myriade Club Social", type: "cafe", neighborhood: "Côte-des-Neiges", schools: ["Polytechnique Montréal", "Université de Montréal"], description: "Simple, clean, no pressure." },
  { name: "Sammi & Soupe Dumpling", type: "food", neighborhood: "Côte-des-Neiges", schools: ["Polytechnique Montréal", "Université de Montréal"], description: "Fun food, breaks awkwardness." },
  { name: "Chatime Côte-des-Neiges", type: "cafe", neighborhood: "Côte-des-Neiges", schools: ["Polytechnique Montréal", "Université de Montréal"], description: "Casual, low commitment." },
  { name: "Parc Jeanne-Mance", type: "park", neighborhood: "Plateau", schools: ["Polytechnique Montréal", "McGill University", "Concordia University"], description: "Open space, easy fallback." },

  // ── UQAM ──
  { name: "Santropol Café", type: "cafe", neighborhood: "Plateau", schools: ["Université du Québec à Montréal (UQAM)", "McGill University"], description: "Very unique, cozy, artsy — great vibe." },
  { name: "La Banquise", type: "food", neighborhood: "Plateau", schools: ["Université du Québec à Montréal (UQAM)"], description: "Fun chaotic date, surprisingly effective." },
  { name: "Place des Arts", type: "park", neighborhood: "Quartier Latin", schools: ["Université du Québec à Montréal (UQAM)", "Concordia University", "Cégep du Vieux Montréal", "Collège LaSalle"], description: "Events + lights + culture." },
  { name: "Café Névé Plateau", type: "cafe", neighborhood: "Plateau", schools: ["Université du Québec à Montréal (UQAM)", "McGill University"], description: "Chill and aesthetic." },
  { name: "Le Darling", type: "bar", neighborhood: "Plateau", schools: ["Université du Québec à Montréal (UQAM)", "Cégep du Vieux Montréal"], description: "Slightly more date night energy." },

  // ── Collège Ahuntsic ──
  { name: "Café Larue & Fils", type: "cafe", neighborhood: "Ahuntsic", schools: ["Collège Ahuntsic", "Collège André-Grasset", "Cégep Marie-Victorin"], description: "One of the best coffee spots in the area, very local date." },
  { name: "Le St-Urbain", type: "food", neighborhood: "Ahuntsic", schools: ["Collège Ahuntsic", "Collège André-Grasset"], description: "Strong brunch energy, safe + easy." },
  { name: "Parc Ahuntsic", type: "park", neighborhood: "Ahuntsic", schools: ["Collège Ahuntsic", "Collège André-Grasset"], description: "Lake + paths, perfect walk date." },
  { name: "Boulangerie Le Pain dans les Voiles", type: "cafe", neighborhood: "Ahuntsic", schools: ["Collège Ahuntsic", "Collège André-Grasset"], description: "Bakery date = low pressure but cute." },

  // ── Collège de Bois-de-Boulogne ──
  { name: "Parc Marcelin-Wilson", type: "park", neighborhood: "Cartierville", schools: ["Collège de Bois-de-Boulogne"], description: "River + sunset = surprisingly elite date." },
  { name: "Café Bistro Van Houtte (Ahuntsic)", type: "cafe", neighborhood: "Ahuntsic", schools: ["Collège de Bois-de-Boulogne"], description: "Simple but reliable." },
  { name: "Pizza Bouquet Fleury", type: "food", neighborhood: "Ahuntsic", schools: ["Collège de Bois-de-Boulogne"], description: "Fun + casual, reduces awkwardness." },
  { name: "Parc de Beauséjour", type: "park", neighborhood: "Cartierville", schools: ["Collège de Bois-de-Boulogne"], description: "Quiet walk option." },

  // ── Collège de Maisonneuve ──
  { name: "Café Hélico", type: "cafe", neighborhood: "Hochelaga", schools: ["Collège de Maisonneuve"], description: "One of the best date cafés in the east." },
  { name: "Le Flamant", type: "bar", neighborhood: "Hochelaga", schools: ["Collège de Maisonneuve"], description: "More date night vibe, underrated gem." },
  { name: "Parc Maisonneuve", type: "park", neighborhood: "Hochelaga", schools: ["Collège de Maisonneuve"], description: "Big open park, easy walking date." },
  { name: "Parc Morgan", type: "park", neighborhood: "Hochelaga", schools: ["Collège de Maisonneuve"], description: "Smaller, intimate park." },

  // ── Collège de Rosemont ──
  { name: "Café Odessa", type: "cafe", neighborhood: "Rosemont", schools: ["Collège de Rosemont"], description: "Very aesthetic, great first impression." },
  { name: "Cinéma Beaubien", type: "food", neighborhood: "Rosemont", schools: ["Collège de Rosemont"], description: "Movie + walk = strong combo." },
  { name: "Plaza St-Hubert", type: "park", neighborhood: "Rosemont", schools: ["Collège de Rosemont"], description: "Walk + lights + shops, underrated." },
  { name: "La Belle Tonki", type: "food", neighborhood: "Rosemont", schools: ["Collège de Rosemont"], description: "Fun food + casual vibe." },

  // ── Cégep de Saint-Laurent ──
  { name: "Parc Saint-Laurent", type: "park", neighborhood: "Saint-Laurent", schools: ["Cégep de Saint-Laurent", "Vanier College"], description: "Green + quiet, best natural option." },
  { name: "Pâtisserie Bervig", type: "cafe", neighborhood: "Saint-Laurent", schools: ["Cégep de Saint-Laurent"], description: "Dessert date = smart move." },

  // ── Cégep du Vieux Montréal ──
  { name: "Café Olimpico Plateau", type: "cafe", neighborhood: "Plateau", schools: ["Cégep du Vieux Montréal", "Université du Québec à Montréal (UQAM)"], description: "Classic, lively, easy first meet." },
  { name: "Square Saint-Louis", type: "park", neighborhood: "Plateau", schools: ["Cégep du Vieux Montréal", "Université du Québec à Montréal (UQAM)"], description: "One of the prettiest casual walk spots in Montreal." },
  { name: "Drogheria Fine", type: "food", neighborhood: "Plateau", schools: ["Cégep du Vieux Montréal"], description: "Cheap gnocchi, surprisingly great casual date." },

  // ── Cégep André-Laurendeau ──
  { name: "Parc des Rapides", type: "park", neighborhood: "LaSalle", schools: ["Cégep André-Laurendeau"], description: "Water + nature = best option in this area." },
  { name: "Parc Angrignon", type: "park", neighborhood: "LaSalle", schools: ["Cégep André-Laurendeau"], description: "Huge park, safe, flexible date." },
  { name: "Café Central Lasalle", type: "cafe", neighborhood: "LaSalle", schools: ["Cégep André-Laurendeau"], description: "Simple but reliable meet spot." },

  // ── Cégep Gérald-Godin ──
  { name: "Cap-Saint-Jacques Nature Park", type: "park", neighborhood: "West Island", schools: ["Cégep Gérald-Godin"], description: "Beach + sunset = hard carry for dates." },
  { name: "Parc-nature du Bois-de-l'Île-Bizard", type: "park", neighborhood: "West Island", schools: ["Cégep Gérald-Godin"], description: "Nature trails, peaceful, low pressure." },
  { name: "Café de Mercanti", type: "cafe", neighborhood: "West Island", schools: ["Cégep Gérald-Godin"], description: "One of the few decent café vibes nearby." },
  { name: "Noire et Blanche", type: "food", neighborhood: "West Island", schools: ["Cégep Gérald-Godin"], description: "Cozy + casual, helps reduce awkwardness." },

  // ── Cégep Marie-Victorin ──
  { name: "Parc-nature de l'Île-de-la-Visitation", type: "park", neighborhood: "Montréal-Nord", schools: ["Cégep Marie-Victorin"], description: "River + trails, best option nearby." },
  { name: "Parc Nicolas-Viel", type: "park", neighborhood: "Ahuntsic", schools: ["Cégep Marie-Victorin"], description: "Quiet + scenic, easy conversation setting." },
  { name: "Pâtisserie St-Martin", type: "cafe", neighborhood: "Laval", schools: ["Cégep Marie-Victorin"], description: "Dessert dates = strong move here." },

  // ── Collège André-Grasset ──
  { name: "La Bête à Pain (Fleury)", type: "cafe", neighborhood: "Ahuntsic", schools: ["Collège André-Grasset", "Collège Ahuntsic"], description: "Slightly more upscale café feel." },

  // ── Collège Jean-de-Brébeuf ──
  { name: "Café Olimpico Outremont", type: "cafe", neighborhood: "Outremont", schools: ["Collège Jean-de-Brébeuf", "Université de Montréal", "HEC Montréal"], description: "Lively but still clean, great balance." },
  { name: "Parc Pratt", type: "park", neighborhood: "Outremont", schools: ["Collège Jean-de-Brébeuf"], description: "Quiet + elegant, underrated gem." },

  // ── Collège LaSalle ──
  { name: "Café Parvis", type: "cafe", neighborhood: "Quartier Latin", schools: ["Collège LaSalle", "Université du Québec à Montréal (UQAM)", "Cégep du Vieux Montréal"], description: "One of the most aesthetic interiors, high impression." },
  { name: "Quartier des Spectacles", type: "park", neighborhood: "Downtown", schools: ["Collège LaSalle", "Concordia University"], description: "Lights + events = built-in experience." },
  { name: "Café Sfouf", type: "cafe", neighborhood: "Downtown", schools: ["Collège LaSalle"], description: "Trendy, unique, stands out." },

  // ── TAV College ──
  { name: "Kazu", type: "food", neighborhood: "Downtown", schools: ["TAV College", "Concordia University", "Dawson College"], description: "Fun, lively, breaks awkwardness." },

  // ── O'Sullivan College ──
  { name: "Olive et Gourmando", type: "cafe", neighborhood: "Old Montreal", schools: ["O'Sullivan College", "McGill University"], description: "Slightly more premium, strong impression." },

  // ── Collège Montmorency ──
  { name: "Centropolis Laval", type: "food", neighborhood: "Laval", schools: ["Collège Montmorency"], description: "Best option in Laval — lights + energy + options." },
  { name: "Café Ricardo Laval", type: "cafe", neighborhood: "Laval", schools: ["Collège Montmorency"], description: "Clean, aesthetic, safe first date." },
  { name: "Parc de la Rivière-des-Mille-Îles", type: "park", neighborhood: "Laval", schools: ["Collège Montmorency"], description: "Nature + water, underrated strong date." },
  { name: "Cosmodôme", type: "food", neighborhood: "Laval", schools: ["Collège Montmorency"], description: "Unique, memorable date." },

  // ── Champlain College Saint-Lambert ──
  { name: "Café Pistache", type: "cafe", neighborhood: "Saint-Lambert", schools: ["Champlain College Saint-Lambert"], description: "Super cute, perfect first date vibe." },
  { name: "Parc Lespérance", type: "park", neighborhood: "Saint-Lambert", schools: ["Champlain College Saint-Lambert"], description: "Calm + green, easy convo." },
  { name: "Saint-Lambert Riverfront", type: "park", neighborhood: "Saint-Lambert", schools: ["Champlain College Saint-Lambert"], description: "View of Montreal skyline, strong romantic play." },
  { name: "Les Assoiffés", type: "bar", neighborhood: "Saint-Lambert", schools: ["Champlain College Saint-Lambert"], description: "Casual but lively, good balance." },

  // ── Cégep Édouard-Montpetit ──
  { name: "Parc Michel-Chartrand", type: "park", neighborhood: "Longueuil", schools: ["Cégep Édouard-Montpetit"], description: "Best option — nature carries the date." },
  { name: "Café Terrasse 1957", type: "cafe", neighborhood: "Longueuil", schools: ["Cégep Édouard-Montpetit"], description: "Solid, simple, works well." },
  { name: "Vieux-Longueuil", type: "park", neighborhood: "Longueuil", schools: ["Cégep Édouard-Montpetit"], description: "Small streets, more romantic feel." },
  { name: "Pizzeria Sofia", type: "food", neighborhood: "Longueuil", schools: ["Cégep Édouard-Montpetit"], description: "Slight travel but much better experience." },

  // ── Cégep de Saint-Jean-sur-Richelieu ──
  { name: "Canal de Chambly", type: "park", neighborhood: "Saint-Jean-sur-Richelieu", schools: ["Cégep de Saint-Jean-sur-Richelieu"], description: "Walk + water, perfect simple date." },
  { name: "Café Crème et Cacao", type: "cafe", neighborhood: "Saint-Jean-sur-Richelieu", schools: ["Cégep de Saint-Jean-sur-Richelieu"], description: "Cozy, local, very date-friendly." },
  { name: "Vieux-Saint-Jean", type: "park", neighborhood: "Saint-Jean-sur-Richelieu", schools: ["Cégep de Saint-Jean-sur-Richelieu"], description: "Old streets, natural charm." },

  // ── Collège Lionel-Groulx ──
  { name: "Café Deux Frères", type: "cafe", neighborhood: "Sainte-Thérèse", schools: ["Collège Lionel-Groulx"], description: "Cozy, aesthetic, perfect first date energy." },
  { name: "Parc du Domaine Vert", type: "park", neighborhood: "Sainte-Thérèse", schools: ["Collège Lionel-Groulx"], description: "Nature + trails, strong connection setting." },
  { name: "Vieux-Sainte-Thérèse", type: "park", neighborhood: "Sainte-Thérèse", schools: ["Collège Lionel-Groulx"], description: "Small streets, intimate vibe." },
  { name: "La Diabla", type: "food", neighborhood: "Sainte-Thérèse", schools: ["Collège Lionel-Groulx"], description: "Slightly more lively, good second date." },

  // ── Cégep de Saint-Jérôme ──
  { name: "Parc régional de la Rivière-du-Nord", type: "park", neighborhood: "Saint-Jérôme", schools: ["Cégep de Saint-Jérôme"], description: "River + nature carries everything." },
  { name: "Café La Petite Voisine", type: "cafe", neighborhood: "Saint-Jérôme", schools: ["Cégep de Saint-Jérôme"], description: "Cute, simple, very date-friendly." },
  { name: "Dieu du Ciel! Saint-Jérôme", type: "bar", neighborhood: "Saint-Jérôme", schools: ["Cégep de Saint-Jérôme"], description: "Fun + relaxed, reduces awkwardness." },

  // ── Cégep régional de Lanaudière ──
  { name: "Île-des-Moulins", type: "park", neighborhood: "Terrebonne", schools: ["Cégep régional de Lanaudière"], description: "One of the best hidden romantic spots outside Montreal." },
  { name: "Vieux-Terrebonne", type: "park", neighborhood: "Terrebonne", schools: ["Cégep régional de Lanaudière"], description: "Lights + restaurants, perfect evening date." },
  { name: "Rivière L'Assomption Walkway", type: "park", neighborhood: "Joliette", schools: ["Cégep régional de Lanaudière"], description: "Simple but effective." },
  { name: "Café La Boîte à Pain", type: "cafe", neighborhood: "Joliette", schools: ["Cégep régional de Lanaudière"], description: "Cozy + reliable." },
  { name: "Parc Léo-Jacques", type: "park", neighborhood: "L'Assomption", schools: ["Cégep régional de Lanaudière"], description: "Calm + nature." },
  { name: "Café Bistro L'Ange Cornu", type: "cafe", neighborhood: "L'Assomption", schools: ["Cégep régional de Lanaudière"], description: "Cute + intimate." },

  // ── Cégep de Valleyfield ──
  { name: "Parc Delpha-Sauvé", type: "park", neighborhood: "Valleyfield", schools: ["Cégep de Valleyfield"], description: "Waterfront + sunsets = elite." },
  { name: "Valleyfield Marina", type: "park", neighborhood: "Valleyfield", schools: ["Cégep de Valleyfield"], description: "Boats + views, strong aesthetic." },
  { name: "Café de la Brûlerie du Vieux", type: "cafe", neighborhood: "Valleyfield", schools: ["Cégep de Valleyfield"], description: "Cozy + local charm." },
  { name: "Vieux-Valleyfield", type: "park", neighborhood: "Valleyfield", schools: ["Cégep de Valleyfield"], description: "Walkable + calm." },
];

async function main() {
  console.log("Clearing old meeting spots...");
  await prisma.meetingSpot.deleteMany();

  console.log("Seeding meeting spots...");
  for (const spot of SPOTS) {
    await prisma.meetingSpot.create({ data: spot });
  }

  console.log(`Seeded ${SPOTS.length} meeting spots across ${new Set(SPOTS.flatMap(s => s.schools)).size} schools.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
