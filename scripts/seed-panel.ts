/**
 * Peuple une base fraîche avec un panel de démonstration réaliste :
 * comptes Supabase + profils Prisma + études.
 *
 * Les réponses qualitatives sont écrites comme de vraies réponses (longueur,
 * vocabulaire, détails concrets) : c'est ce que le ghost file analyse, un
 * lorem ipsum produirait des scores et des tags inutilisables.
 *
 * Run : npx tsx --env-file=.env.local scripts/seed-panel.ts
 *       npx tsx --env-file=.env.local scripts/seed-panel.ts --reset
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Jamais dans le dépôt : ces comptes existent dans la base de production.
const PASSWORD = process.env.SEED_PASSWORD ?? "";
if (PASSWORD.length < 10) {
  console.error("Définir SEED_PASSWORD (10 caractères minimum) dans .env.local.");
  process.exit(1);
}
const RESET = process.argv.includes("--reset");

// Index dans lib/onboarding/types.ts → MACRO :
// 0 luxe · 1 streetwear · 2 contemporain FR · 3 contemporain intl · 4 sport · 5 vintage

type SeedParticipant = {
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  birthYear: number;
  gender: string;
  employmentStatus: string;
  educationLevel: string;
  householdIncome: string;
  macroUniverses: string[];
  brandAffinities: string[];
  engagementTypes: string[];
  selfProfileType: string;
  behavioralChecklist: string[];
  adaptiveAnswers: Record<string, string>;
  expertAnswers: Record<string, string>;
  linkedinUrl?: string;
  instagramUrl?: string;
  followerRange?: string;
  profession: string;
};

const PARTICIPANTS: SeedParticipant[] = [
  {
    email: "amina.dieng@example.com",
    firstName: "Amina", lastName: "Dieng", city: "Paris", birthYear: 1996, gender: "Femme",
    employmentStatus: "Freelance / Indépendant(e)", educationLevel: "Master / Grande École",
    householdIncome: "35 000 € – 55 000 €",
    profession: "Styliste indépendante",
    macroUniverses: ["0", "2"],
    brandAffinities: ["Lemaire", "Céline", "Jacquemus", "Loewe", "A.P.C."],
    engagementTypes: ["Je suis leurs collections et défilés", "J'assiste à leurs événements", "Je travaille ou ai travaillé avec elles"],
    selfProfileType: "industry_insider",
    behavioralChecklist: ["industry_access", "show_access", "industry_work", "fashion_intel", "prescripteur"],
    adaptiveAnswers: {
      org: "Je travaille en freelance pour des studios de création, principalement sur du prêt-à-porter femme. J'ai été assistante styliste chez Lemaire pendant deux ans, puis j'ai monté ma structure en 2022. Je fais surtout du consulting collection et du styling éditorial.",
      role: "Sur le défilé AW25 d'une maison parisienne j'étais en charge du fitting des silhouettes 12 à 24. Concrètement je gérais l'ordre de passage avec la DA, les retouches de dernière minute et la coordination avec les mannequins en backstage.",
    },
    expertAnswers: {
      self: "Je suis une professionnelle de la mode qui achète très peu mais très précisément — je préfère une pièce de coupe irréprochable tous les six mois qu'un renouvellement permanent.",
      discover: "J'ai commencé à parler de Sarah Levy à mon entourage début 2024, quand elle ne faisait encore que des pièces sur commande à Belleville. Je l'ai découverte via une amie brodeuse. Depuis elle est distribuée chez Tom Greyhound et les prix ont doublé.",
      brand: "La décision de Bottega de couper tous ses réseaux sociaux en 2021 m'avait marquée positivement — c'était courageux. Le retour en arrière deux ans plus tard m'a beaucoup plus marquée, négativement : ça a rétroactivement transformé un geste en coup de com.",
    },
    linkedinUrl: "https://linkedin.com/in/amina-dieng-styliste",
    instagramUrl: "@aminadieng", followerRange: "5k-20k",
  },
  {
    email: "thomas.roux@example.com",
    firstName: "Thomas", lastName: "Roux", city: "Lyon", birthYear: 2001, gender: "Homme",
    employmentStatus: "Étudiant(e)", educationLevel: "Licence / Bachelor",
    householdIncome: "Moins de 20 000 €",
    profession: "Étudiant en école de commerce",
    macroUniverses: ["1", "4"],
    brandAffinities: ["Nike", "New Balance", "Adidas Originals", "Represent", "Stone Island"],
    engagementTypes: ["J'achète régulièrement leurs produits", "Je revends / collecte leurs pièces", "Je fais de la veille (newsletters, Instagram…)"],
    selfProfileType: "collector_reseller",
    behavioralChecklist: ["drop_alert", "queue_physical", "resale_active", "sneaker_collector", "community_member"],
    adaptiveAnswers: {
      platforms: "Principalement StockX et Vinted pour l'achat, Grailed quand je cherche des pièces plus rares. Pour la revente je suis passé quasi exclusivement sur Vinted parce que les frais StockX sur des paires à moins de 200 € tuent la marge.",
      transaction: "J'ai revendu une paire de New Balance 990v3 MiUSA en gris, achetée 210 € au drop en février, revendue 340 € en mai. Je l'ai gardée trois mois parce que je savais que le coloris allait sortir de stock partout — c'est un modèle qui ne revient jamais en restock rapide.",
    },
    expertAnswers: {
      self: "Je suis un acheteur assez obsessionnel sur un créneau très étroit : les sneakers de running vintage et les rééditions, sur lesquelles je connais à peu près tout ce qui sort.",
      discover: "J'ai poussé Salomon à mes potes début 2023, avant que tout le monde s'y mette. J'avais vu passer les XT-6 sur des comptes de gorpcore japonais, j'en ai pris une paire, et maintenant la moitié de ma promo en porte.",
      brand: "Le passage de New Balance sur des collabs très haut de gamme m'a marqué négativement. Je comprends la stratégie mais ça a fait exploser les prix sur les modèles classiques qui n'avaient rien à voir avec les collabs.",
    },
    instagramUrl: "@thmsrx", followerRange: "1k-5k",
  },
  {
    email: "sofia.lambert@example.com",
    firstName: "Sofia", lastName: "Lambert", city: "Bordeaux", birthYear: 1989, gender: "Femme",
    employmentStatus: "Cadre / Manager", educationLevel: "Master / Grande École",
    householdIncome: "55 000 € – 80 000 €",
    profession: "Directrice artistique",
    macroUniverses: ["0", "3"],
    brandAffinities: ["Totême", "Acne Studios", "Hermès", "Margaret Howell", "Lemaire"],
    engagementTypes: ["Je suis leurs collections et défilés", "J'achète régulièrement leurs produits", "Je les recommande à mon entourage"],
    selfProfileType: "advanced_consumer",
    behavioralChecklist: ["prescripteur", "fashion_intel", "industry_access"],
    adaptiveAnswers: {
      budget: "Autour de 400 € par mois lissé sur l'année, mais très irrégulier : je n'achète presque rien pendant quatre mois puis je prends une pièce à 1200 €. Je répartis à peu près 70 % vêtement, 20 % chaussures, 10 % accessoires. Je n'achète quasiment plus de basiques, je les ai déjà.",
    },
    expertAnswers: {
      self: "Je suis une acheteuse de fin de cycle : j'attends qu'une marque ait fait ses preuves sur deux ou trois saisons avant d'investir, et ensuite je rachète la même chose pendant des années.",
      discover: "J'ai recommandé Róhe à trois collègues l'hiver dernier, quand la marque n'avait encore qu'un point de vente à Paris. Je l'avais repérée sur un compte de stylisme néerlandais. Aujourd'hui elles ont toutes au moins une pièce.",
      brand: "L'augmentation de prix d'Acne Studios sur les mailles entre 2022 et 2024 m'a fait décrocher. La qualité n'a pas suivi la courbe, et quand je compare une pièce de 2019 et une de 2024 la différence de main est visible.",
    },
    linkedinUrl: "https://linkedin.com/in/sofia-lambert-da",
  },
  {
    email: "ines.benali@example.com",
    firstName: "Inès", lastName: "Benali", city: "Paris", birthYear: 2000, gender: "Femme",
    employmentStatus: "CDI temps plein", educationLevel: "Licence / Bachelor",
    householdIncome: "20 000 € – 35 000 €",
    profession: "Journaliste mode junior",
    macroUniverses: ["5", "2"],
    brandAffinities: ["Vestiaire Collective", "Vinted", "Sézane", "Rouje", "Depop"],
    engagementTypes: ["Je fais de la veille (newsletters, Instagram…)", "Je revends / collecte leurs pièces", "Je les recommande à mon entourage"],
    selfProfileType: "analyst",
    behavioralChecklist: ["resale_active", "fashion_intel", "community_member", "prescripteur"],
    adaptiveAnswers: {
      sources: "Business of Fashion et Vogue Business pour l'industrie, mais surtout des newsletters plus petites : Blackbird Spyplane, Perfectly Imperfect, et un Discord d'archivistes mode assez confidentiel. Je regarde aussi beaucoup les ventes Vestiaire pour voir ce qui prend de la valeur.",
      trend: "J'ai écrit sur le retour du denim taille basse fin 2022 alors que la rédaction trouvait ça improbable. Je l'avais vu monter sur Depop d'abord, avec des prix qui doublaient sur des pièces Diesel des années 2000.",
    },
    expertAnswers: {
      self: "Je suis une observatrice avant d'être une consommatrice : j'achète presque exclusivement en seconde main et je passe beaucoup plus de temps à analyser le marché qu'à acheter.",
      discover: "J'ai signalé la remontée de Miu Miu à ma rédac chef six mois avant que ça devienne évident, parce que je voyais les prix de revente des jupes s'envoler sur Vestiaire alors que la presse n'en parlait pas encore.",
      brand: "Le lancement de la plateforme de revente officielle de Balenciaga m'a marquée positivement — c'est une des rares maisons à avoir accepté de cannibaliser son propre neuf plutôt que de laisser le marché gris se faire sans elle.",
    },
    instagramUrl: "@inesbnl", followerRange: "1k-5k",
  },
  {
    email: "lucas.moreau@example.com",
    firstName: "Lucas", lastName: "Moreau", city: "Paris", birthYear: 1993, gender: "Homme",
    employmentStatus: "CDI temps plein", educationLevel: "Master / Grande École",
    householdIncome: "55 000 € – 80 000 €",
    profession: "Buyer retail",
    macroUniverses: ["1", "3"],
    brandAffinities: ["Casablanca", "Ami Paris", "Kith", "Our Legacy", "Stone Island"],
    engagementTypes: ["Je travaille ou ai travaillé avec elles", "J'assiste à leurs événements", "Je suis leurs collections et défilés"],
    selfProfileType: "industry_insider",
    behavioralChecklist: ["industry_work", "industry_access", "show_access", "fashion_intel"],
    adaptiveAnswers: {
      org: "Je suis buyer menswear pour un groupe de concept stores multimarques, trois points de vente en France plus le e-shop. Avant j'étais assistant achat chez un distributeur de marques scandinaves.",
      role: "Pour le lancement d'une capsule chez nous l'été dernier, j'ai construit le plan d'achat, négocié les exclusivités de coloris et défini le merchandising du corner. J'étais aussi sur le press day à Paris pour présenter la sélection.",
    },
    expertAnswers: {
      self: "Je regarde les vêtements avec un œil d'acheteur avant tout : je pense en termes de prix de vente conseillé, de rotation et de taux de démarque, même quand j'achète pour moi.",
      discover: "J'ai référencé Le Père un an avant que la marque passe chez les gros distributeurs. Je les avais vus à Tranoï sur un tout petit stand, la construction des vestes était très au-dessus du prix demandé.",
      brand: "La décision de plusieurs marques de passer en direct-to-consumer en coupant les multimarques m'a marqué négativement, évidemment de mon point de vue — mais aussi parce que celles qui l'ont fait ont perdu la prescription qu'on leur apportait en boutique.",
    },
    linkedinUrl: "https://linkedin.com/in/lucas-moreau-buyer",
  },
  {
    email: "camille.fontaine@example.com",
    firstName: "Camille", lastName: "Fontaine", city: "Marseille", birthYear: 1998, gender: "Non-binaire",
    employmentStatus: "Auto-entrepreneur(e)", educationLevel: "Formation pro / autodidacte",
    householdIncome: "20 000 € – 35 000 €",
    profession: "Créateur·rice de contenu mode",
    macroUniverses: ["5", "1"],
    brandAffinities: ["Grailed", "Rick Owens", "Maison Margiela", "Vinted", "Palace"],
    engagementTypes: ["Je fais de la veille (newsletters, Instagram…)", "Je les recommande à mon entourage", "Je revends / collecte leurs pièces"],
    selfProfileType: "tastemaker",
    behavioralChecklist: ["resale_active", "community_member", "prescripteur", "fashion_intel", "drop_alert"],
    adaptiveAnswers: {
      advice: "Une amie m'a demandé la semaine dernière quoi acheter pour remplacer un manteau. Je l'ai orientée vers de l'archive Margiela sur Vinted plutôt que du neuf, on a mis trois jours à trouver la bonne taille mais elle l'a eu à 180 € au lieu de 900.",
      presence: "Oui, je poste sur Instagram et TikTok, surtout des vidéos où je décompose pourquoi une pièce est bien construite. Environ 18 000 abonnés cumulés, une communauté très engagée sur l'archive et le vintage.",
    },
    expertAnswers: {
      self: "Je suis quelqu'un qui achète presque exclusivement de l'archive et qui passe son temps à convaincre les autres que le neuf n'est pas obligatoire.",
      discover: "J'ai été un des premiers comptes francophones à parler de Kiko Kostadinov en 2019, bien avant les collabs ASICS. Aujourd'hui c'est devenu mainstream dans le milieu mais à l'époque personne ne savait prononcer le nom.",
      brand: "La sortie du sac Sacai x Carhartt m'a marqué·e positivement parce que c'est une des rares collabs où les deux identités restent lisibles au lieu de se diluer en logo sur logo.",
    },
    instagramUrl: "@camfontaine", followerRange: "5k-20k",
  },
  {
    email: "nadia.cherif@example.com",
    firstName: "Nadia", lastName: "Cherif", city: "Lille", birthYear: 1985, gender: "Femme",
    employmentStatus: "Directeur(rice) / C-level", educationLevel: "Master / Grande École",
    householdIncome: "80 000 € – 120 000 €",
    profession: "Directrice marketing retail",
    macroUniverses: ["0", "4"],
    brandAffinities: ["Hermès", "Moncler", "Lacoste", "Arc'teryx", "Loro Piana"],
    engagementTypes: ["J'achète régulièrement leurs produits", "J'assiste à leurs événements", "Je les recommande à mon entourage"],
    selfProfileType: "advanced_consumer",
    behavioralChecklist: ["industry_work", "prescripteur", "industry_access"],
    adaptiveAnswers: {
      budget: "Environ 800 € par mois, très orienté pièces durables. Je répartis grosso modo moitié vêtement moitié maroquinerie et chaussures. Je n'achète plus jamais en soldes, j'ai arrêté quand j'ai réalisé que je ne portais pas ce que j'achetais en soldes.",
    },
    expertAnswers: {
      self: "Je suis une acheteuse de qualité perçue : je paie cher pour du matériau et de la finition, et je suis assez insensible au logo et au discours de marque.",
      discover: "J'ai fait découvrir Arc'teryx Veilance à mon mari et à deux collègues il y a quatre ans, quand c'était encore un truc de niche technique. Maintenant on en voit en réunion.",
      brand: "La montée en gamme continue de Lacoste sur certaines lignes m'intéresse mais ne me convainc pas encore — le positionnement prix bouge plus vite que la perception, et je pense que le consommateur ne suit pas.",
    },
    linkedinUrl: "https://linkedin.com/in/nadia-cherif",
  },
  {
    email: "julien.petit@example.com",
    firstName: "Julien", lastName: "Petit", city: "Nantes", birthYear: 2003, gender: "Homme",
    employmentStatus: "Étudiant(e)", educationLevel: "Bac ou moins",
    householdIncome: "Moins de 20 000 €",
    profession: "Étudiant en design",
    macroUniverses: ["1"],
    brandAffinities: ["Supreme", "Palace", "AWAKE NY", "Nike", "Carhartt WIP"],
    engagementTypes: ["J'achète régulièrement leurs produits", "Je fais de la veille (newsletters, Instagram…)"],
    selfProfileType: "early_adopter",
    behavioralChecklist: ["drop_alert", "queue_physical", "community_member"],
    adaptiveAnswers: {
      adopted: "J'ai acheté du Corteiz début 2022 quand il fallait encore passer par des drops surprise annoncés une heure avant sur Instagram. Personne en France n'en portait. J'ai su par un pote qui habite Londres.",
      waitlist: "Je suis sur la liste de Bstroy et sur celle d'une petite marque parisienne qui s'appelle Nuits Balnéaires. J'attends aussi un restock chez Arc'teryx sur une veste précise.",
    },
    expertAnswers: {
      self: "Je suis quelqu'un qui suit de très près une poignée de marques de niche et qui achète rarement mais toujours au moment du drop.",
      discover: "J'ai parlé de Corteiz à tout mon lycée en 2022, on était deux à en avoir. Aujourd'hui la marque est distribuée partout et franchement ça m'a fait décrocher.",
      brand: "La gestion des drops par Supreme depuis le rachat par VF m'a marqué négativement : il y a beaucoup plus de stock, donc plus de hype, donc moins d'intérêt.",
    },
    instagramUrl: "@jlnptt", followerRange: "0",
  },
];

const BRANDS = [
  { email: "insights@maison-demo.com", companyName: "Maison Démo", industry: "Luxe", credits: 15 },
  { email: "research@sport-demo.com", companyName: "Sport Démo", industry: "Sportswear", credits: 8 },
];

async function upsertAuthUser(email: string, role: "BRAND" | "PARTICIPANT"): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  });

  if (!error && data.user) return data.user.id;

  // Déjà présent — on récupère son id.
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const found = list?.users.find((u) => u.email === email);
  if (!found) throw new Error(`Impossible de créer ou retrouver ${email} : ${error?.message}`);
  return found.id;
}

async function main() {
  if (RESET) {
    console.log("⚠️  --reset : suppression des données de démonstration…");
    await prisma.participantGhostFile.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.study.deleteMany({});
    await prisma.participantProfile.deleteMany({});
    await prisma.brandProfile.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } });
  }

  console.log("\nMot de passe des comptes de démo : celui de SEED_PASSWORD\n");

  for (const b of BRANDS) {
    const supabaseId = await upsertAuthUser(b.email, "BRAND");
    await prisma.user.upsert({
      where: { email: b.email },
      update: { supabaseId },
      create: {
        email: b.email, role: "BRAND", supabaseId,
        brandProfile: {
          create: {
            companyName: b.companyName, industry: b.industry,
            credits: b.credits, isVerified: true, isActivated: true,
          },
        },
      },
    });
    console.log(`  marque       ${b.email}  (${b.credits} crédits)`);
  }

  for (const p of PARTICIPANTS) {
    const supabaseId = await upsertAuthUser(p.email, "PARTICIPANT");
    const profileData = {
      firstName: p.firstName, lastName: p.lastName, city: p.city, country: "FR",
      dateOfBirth: new Date(`${p.birthYear}-06-15`), gender: p.gender,
      profession: p.profession,
      employmentStatus: p.employmentStatus, educationLevel: p.educationLevel,
      householdIncome: p.householdIncome,
      macroUniverses: p.macroUniverses, brandAffinities: p.brandAffinities,
      engagementTypes: p.engagementTypes, selfProfileType: p.selfProfileType,
      behavioralChecklist: p.behavioralChecklist,
      adaptiveAnswers: p.adaptiveAnswers, expertAnswers: p.expertAnswers,
      linkedinUrl: p.linkedinUrl ?? null, instagramUrl: p.instagramUrl ?? null,
      followerRange: p.followerRange ?? null,
      interviewLanguages: ["Français"], preferredFormat: "both",
      rewardPreference: "cash",
      agreedToCodeOfConduct: true,
      onboardingStep: 11, onboardingStatus: "complete",
      idVerificationStatus: "VERIFIED" as const, idVerifiedAt: new Date(),
    };

    await prisma.user.upsert({
      where: { email: p.email },
      update: { supabaseId, participantProfile: { update: profileData } },
      create: {
        email: p.email, role: "PARTICIPANT", supabaseId,
        participantProfile: { create: profileData },
      },
    });
    console.log(`  participant  ${p.email.padEnd(32)} ${p.profession}`);
  }

  const brand = await prisma.brandProfile.findFirst({ where: { companyName: "Maison Démo" } });
  if (brand) {
    const existing = await prisma.study.findFirst({ where: { brandProfileId: brand.id } });
    if (!existing) {
      await prisma.study.create({
        data: {
          brandProfileId: brand.id,
          title: "Perception du quiet luxury chez les 25-35 ans",
          objective:
            "Comprendre comment la génération 25-35 ans qualifie le luxe discret, quels signaux de qualité elle sait lire, et ce qui la fait basculer d'une marque à l'autre.",
          studyType: "ONE_ON_ONE", status: "ACTIVE",
          targetParticipantCount: 6, interviewDuration: 45,
          rewardAmount: 8000, rewardType: "CASH",
          deadlineAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          targetCriteria: {
            ageMin: 25, ageMax: 35, cities: ["Paris", "Lyon", "Bordeaux"],
            interests: ["luxe", "mode contemporaine"],
            brandAffinities: ["Lemaire", "Totême", "Céline"],
            profession: "", custom: "Privilégier les profils qui achètent réellement dans ce segment.",
          },
        },
      });
      console.log("\n  étude        « Perception du quiet luxury chez les 25-35 ans » (ACTIVE)");
    }
  }

  const counts = {
    participants: await prisma.participantProfile.count(),
    marques: await prisma.brandProfile.count(),
    etudes: await prisma.study.count(),
  };
  console.log("\n✓ Seed terminé :", counts);
  console.log("\nProchaine étape — générer les ghost files :");
  console.log("  npx tsx --env-file=.env.local scripts/generate-ghost-files.ts\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
