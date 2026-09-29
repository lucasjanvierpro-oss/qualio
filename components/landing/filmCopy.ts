import type { Lang } from "@/lib/i18n/detect";

// Tous les textes du film, en français et en anglais. Les scènes (Film.tsx)
// ne contiennent que la mise en scène : minutage, curseur, animations.

export type SceneId = "brief" | "profils" | "date" | "visio" | "synthese" | "decision";

type SceneText = { label: string; step: string; caption: string; url: string };
type Profile = { name: string; role: string; why: string; tierLabel: string };

export type FilmCopy = {
  locale: string;
  quote: (s: string) => string;
  scenes: Record<SceneId, SceneText>;
  tablist: string;
  paused: string;
  scrollHint: string;
  brief: {
    text: string;
    newBrief: string; newBriefHint: string; drop: string; fileName: string; fileMeta: string;
    enough: string; send: string; sent: string;
    understood: string; readIn: string; reading: string;
    rows: { profiles: string; chips: [string, string]; format: string; formatV: string; decide: string; decideV: string; budget: string; budgetV: string; budgetSub: string };
  };
  profiles: {
    list: Profile[];
    proposed: string; reviewed: string; balance: string; credits: string; cr: string; keep: string; kept: string;
    keptCount: (n: number) => string; worth: (eur: string) => string; confirm: string; paid: string;
  };
  date: {
    days: string[]; slots: [string, string, string]; hour: (h: number) => string;
    title: string; hint: string; confirmed: string; proposedBy: string;
    done: string; waiting: string; when: string; inviteTitle: string; inviteText: string;
    checklist: [string, string, string];
  };
  call: {
    lines: [string, string, string]; guide: [string, string, string, string];
    who: string; you: string; speaker: string; guideTitle: string; whyTitle: string; whyText: string;
  };
  synth: {
    title: string; ended: string; video: string; videoMeta: string; transcript: string; transcriptMeta: string;
    download: string; synthesis: string; ready: string; writing: (p: number) => string; waiting: string; open: string;
    excerpts: string; moments: [string, string, string];
    kicker: string; heading: string; insights: [string, string, string]; verbatim: string; cite: string; themes: [string, string, string];
  };
  decision: {
    board: string; when: string; source: string;
    items: [{ text: string; source: string; label: string }, { text: string; source: string; label: string }, { text: string; source: string; label: string }];
    tally: [string, string, string, string];
    quotes: [{ q: string; who: string }, { q: string; who: string }, { q: string; who: string }];
  };
};

const FR: FilmCopy = {
  locale: "fr-FR",
  quote: (s) => `« ${s} »`,
  scenes: {
    brief: { label: "Brief", step: "Écrivez ou déposez votre brief", url: "rarelyst.co/marque/nouvelle-etude",
      caption: "Vous écrivez ce que vous cherchez, ou vous déposez votre brief. L'IA en tire les profils, le format et ce que la synthèse devra trancher." },
    profils: { label: "Profils", step: "Gardez les profils qui vous parlent", url: "rarelyst.co/marque/etudes/maroquinerie",
      caption: "Des profils prouvés vous sont proposés, revus à la main par l'équipe. Chacun affiche son prix : vous ne payez que ceux que vous gardez." },
    date: { label: "Date", step: "Choisissez un créneau", url: "rarelyst.co/marque/etudes/maroquinerie",
      caption: "Le participant propose ses créneaux, vous en choisissez un. La salle de visio, l'invitation et les rappels partent seuls." },
    visio: { label: "Visio", step: "Menez l'entretien", url: "rarelyst.co/entretien/salle-privee",
      caption: "Vous menez l'entretien, votre guide à côté. Il est enregistré et transcrit pendant que vous parlez." },
    synthese: { label: "Synthèse", step: "Récupérez tout, synthèse comprise", url: "rarelyst.co/marque/etudes/maroquinerie/synthese",
      caption: "La vidéo et la transcription sont prêtes à la fin de l'appel. La synthèse de l'étude suit, construite autour de vos questions." },
    decision: { label: "Décision", step: "Décidez, preuves à l'appui", url: "rarelyst.co/marque/etudes/maroquinerie/synthese",
      caption: "Vous arrivez en comité avec des verbatims, pas des impressions. Chaque décision renvoie à ce qui a été dit." },
  },
  tablist: "Une étude, de bout en bout",
  paused: "En pause",
  scrollHint: "Faites défiler : le film avance avec vous.",
  brief: {
    text: "On lance une ligne de maroquinerie en cuir recyclé. On veut entendre des acheteuses de luxe qui achètent aussi en seconde main, et des vendeuses en boutique.",
    newBrief: "Nouveau brief", newBriefHint: "Écrivez, ou déposez un document", drop: "Glissez un PDF, un Word ou un PowerPoint",
    fileName: "brief-maroquinerie-FW27.pdf", fileMeta: "2,4 Mo · 12 pages",
    enough: "Ou quelques phrases suffisent.", send: "Envoyer le brief →", sent: "Brief envoyé ✓",
    understood: "Ce que nous avons compris", readIn: "Lu en 6 secondes", reading: "Lecture du brief…",
    rows: {
      profiles: "Profils", chips: ["Acheteuses de luxe, aussi en seconde main", "Vendeuses en boutique"],
      format: "Format", formatV: "6 entretiens · 45 min · en visio",
      decide: "À trancher", decideV: "Le prix de lancement · 3 ou 5 coloris",
      budget: "Budget", budgetV: "234 à 414 crédits", budgetSub: "selon les profils retenus",
    },
  },
  profiles: {
    list: [
      { name: "Camille R.", role: "Acheteuse luxe · Paris · 34 ans", why: "Trois à quatre sacs par an, la moitié en seconde main.", tierLabel: "Initiée" },
      { name: "Inès B.", role: "Vendeuse en boutique de luxe · 8 ans", why: "Voit quarante clientes par semaine hésiter devant un prix.", tierLabel: "Rare" },
      { name: "Sofia M.", role: "Revendeuse seconde main · Lyon", why: "Revend trente sacs par mois, connaît la cote de chaque modèle.", tierLabel: "Initiée" },
      { name: "Jeanne L.", role: "Cliente avertie · Bordeaux · 29 ans", why: "A comparé cinq marques de cuir recyclé cette année.", tierLabel: "Averti" },
    ],
    proposed: "3 profils proposés", reviewed: "Sélection revue par l'équipe", balance: "Solde", credits: "crédits", cr: "cr.",
    keep: "Garder", kept: "✓ Gardé",
    keptCount: (n) => `${n} profil${n > 1 ? "s" : ""} gardé${n > 1 ? "s" : ""}`,
    worth: (eur) => `soit ${eur} € HT`, confirm: "Confirmer", paid: "Payé ✓",
  },
  date: {
    days: ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."], slots: ["14 h", "10 h", "17 h 30"], hour: (h) => `${h} h`,
    title: "Camille propose trois créneaux", hint: "Choisissez, c'est confirmé", confirmed: "Confirmé", proposedBy: "Proposé par Camille",
    done: "Entretien confirmé", waiting: "En attente de votre choix", when: "Jeudi · 10 h · 45 min",
    inviteTitle: "Invitation d'une maison vérifiée", inviteText: "Camille voit votre poinçon, pas votre nom, jusqu'au jour J.",
    checklist: ["Salle de visio privée créée", "Invitation envoyée à Camille", "Rappels la veille et une heure avant"],
  },
  call: {
    lines: [
      "Qu'est-ce qui vous ferait payer un sac en cuir recyclé au prix du neuf ?",
      "Qu'on ne le voie pas. Je l'achète pour la pièce, pas pour le discours.",
      "Et trois coloris, pas cinq : le noir partira, le reste finira en soldes.",
    ],
    guide: ["Vos derniers achats de maroquinerie", "Le cuir recyclé : frein ou argument ?", "Combien de coloris ?", "Le prix juste pour ce sac"],
    who: "Camille R. · Acheteuse luxe", you: "Vous", speaker: "Camille", guideTitle: "Votre guide", whyTitle: "Pourquoi Camille",
    whyText: "Trois à quatre sacs par an, la moitié en seconde main. Refuse de payer « l'histoire » d'un produit.",
  },
  synth: {
    title: "Entretien avec Camille R.", ended: "Terminé · 44 min",
    video: "Vidéo de l'entretien", videoMeta: "MP4 · 44 min", transcript: "Transcription", transcriptMeta: "6 820 mots · horodatée",
    download: "Télécharger", synthesis: "Synthèse de l'étude", ready: "6 entretiens sur 6 · prête", writing: (p) => `Rédaction · ${p} %`,
    waiting: "En attente des entretiens", open: "Ouvrir",
    excerpts: "Extraits de la transcription",
    moments: ["Je l'achète pour la pièce, pas pour le discours.", "Trois coloris, pas cinq : le noir partira.", "À ce prix, je veux voir la couture de près."],
    kicker: "Synthèse · Maroquinerie en cuir recyclé", heading: "Le recyclé se vend par la pièce, pas par le discours",
    insights: [
      "« Recyclé » rassure l'acheteuse de seconde main, pas la cliente du neuf.",
      "Cinq coloris diluent la collection : trois suffisent, le noir porte les ventes.",
      "Le prix du neuf passe si la finition est irréprochable.",
    ],
    verbatim: "Je l'achète pour la pièce, pas pour le discours.", cite: "Acheteuse luxe, 34 ans",
    themes: ["Finition", "Prix", "Discours écologique"],
  },
  decision: {
    board: "Comité produit", when: "Lundi · 9 h", source: "Source :",
    items: [
      { text: "Lancer en trois coloris : noir, cognac, sable", source: "5 entretiens sur 6", label: "Décidé" },
      { text: "Ne pas écrire « recyclé » sur l'étiquette", source: "4 entretiens sur 6", label: "Décidé" },
      { text: "Tester 420 € auprès de six clientes", source: "Question ouverte de la synthèse", label: "À tester" },
    ],
    tally: ["12 jours", "du brief au comité", "entretiens", "décisions sourcées"],
    quotes: [
      { q: "Trois coloris, pas cinq : le noir partira.", who: "Acheteuse luxe, 34 ans" },
      { q: "Si c'est écrit recyclé, je pense seconde main.", who: "Vendeuse en boutique, 8 ans" },
      { q: "À 420 €, je veux voir la couture de près.", who: "Cliente avertie, 29 ans" },
    ],
  },
};

const EN: FilmCopy = {
  locale: "en-GB",
  quote: (s) => `“${s}”`,
  scenes: {
    brief: { label: "Brief", step: "Write or upload your brief", url: "rarelyst.co/brand/new-study",
      caption: "Write what you're looking for, or upload your brief. AI turns it into profiles, a format and the questions your synthesis must answer." },
    profils: { label: "Profiles", step: "Keep the profiles you like", url: "rarelyst.co/brand/studies/leather-goods",
      caption: "You get proven profiles, each reviewed by hand by our team. Every one shows its price: you only pay for the ones you keep." },
    date: { label: "Schedule", step: "Pick a time slot", url: "rarelyst.co/brand/studies/leather-goods",
      caption: "The participant suggests time slots, you pick one. The video room, invitation and reminders go out on their own." },
    visio: { label: "Call", step: "Run the interview", url: "rarelyst.co/interview/private-room",
      caption: "You lead the interview with your guide alongside. It's recorded and transcribed while you talk." },
    synthese: { label: "Synthesis", step: "Get everything, synthesis included", url: "rarelyst.co/brand/studies/leather-goods/synthesis",
      caption: "The video and transcript are ready when the call ends. The study synthesis follows, built around your questions." },
    decision: { label: "Decision", step: "Decide, with evidence", url: "rarelyst.co/brand/studies/leather-goods/synthesis",
      caption: "You walk into the meeting with verbatims, not impressions. Every decision points back to what was said." },
  },
  tablist: "A study, end to end",
  paused: "Paused",
  scrollHint: "Keep scrolling: the film moves with you.",
  brief: {
    text: "We're launching a recycled-leather handbag line. We want to hear from luxury shoppers who also buy second-hand, and from boutique sales associates.",
    newBrief: "New brief", newBriefHint: "Write, or upload a document", drop: "Drop a PDF, Word or PowerPoint file",
    fileName: "leather-goods-brief-FW27.pdf", fileMeta: "2.4 MB · 12 pages",
    enough: "Or a few sentences will do.", send: "Send brief →", sent: "Brief sent ✓",
    understood: "What we understood", readIn: "Read in 6 seconds", reading: "Reading your brief…",
    rows: {
      profiles: "Profiles", chips: ["Luxury shoppers who also buy second-hand", "Boutique sales associates"],
      format: "Format", formatV: "6 interviews · 45 min · video call",
      decide: "To decide", decideV: "Launch price · 3 or 5 colours",
      budget: "Budget", budgetV: "234 to 414 credits", budgetSub: "depending on the profiles you keep",
    },
  },
  profiles: {
    list: [
      { name: "Camille R.", role: "Luxury shopper · Paris · 34", why: "Buys three to four bags a year, half of them second-hand.", tierLabel: "Insider" },
      { name: "Inès B.", role: "Luxury boutique associate · 8 yrs", why: "Sees forty clients a week hesitate over a price tag.", tierLabel: "Rare" },
      { name: "Sofia M.", role: "Second-hand reseller · Lyon", why: "Resells thirty bags a month, knows every model's value.", tierLabel: "Insider" },
      { name: "Jeanne L.", role: "Savvy customer · Bordeaux · 29", why: "Compared five recycled-leather brands this year.", tierLabel: "Savvy" },
    ],
    proposed: "3 profiles suggested", reviewed: "Reviewed by our team", balance: "Balance", credits: "credits", cr: "cr.",
    keep: "Keep", kept: "✓ Kept",
    keptCount: (n) => `${n} profile${n > 1 ? "s" : ""} kept`,
    worth: (eur) => `i.e. €${eur} excl. VAT`, confirm: "Confirm", paid: "Paid ✓",
  },
  date: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"], slots: ["2 pm", "10 am", "5:30 pm"], hour: (h) => (h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`),
    title: "Camille suggests three slots", hint: "Pick one, it's confirmed", confirmed: "Confirmed", proposedBy: "Suggested by Camille",
    done: "Interview confirmed", waiting: "Waiting for your choice", when: "Thursday · 10 am · 45 min",
    inviteTitle: "Invitation from a verified house", inviteText: "Camille sees your hallmark, not your name, until the day.",
    checklist: ["Private video room created", "Invitation sent to Camille", "Reminders the day before and an hour before"],
  },
  call: {
    lines: [
      "What would make you pay full price for a recycled-leather bag?",
      "If you can't tell. I buy it for the piece, not for the story.",
      "And three colours, not five: black will sell, the rest will end up on sale.",
    ],
    guide: ["Your latest leather goods purchases", "Recycled leather: turn-off or selling point?", "How many colours?", "The right price for this bag"],
    who: "Camille R. · Luxury shopper", you: "You", speaker: "Camille", guideTitle: "Your guide", whyTitle: "Why Camille",
    whyText: "Three to four bags a year, half second-hand. Won't pay for a product's \"story\".",
  },
  synth: {
    title: "Interview with Camille R.", ended: "Ended · 44 min",
    video: "Interview video", videoMeta: "MP4 · 44 min", transcript: "Transcript", transcriptMeta: "6,820 words · timestamped",
    download: "Download", synthesis: "Study synthesis", ready: "6 of 6 interviews · ready", writing: (p) => `Writing · ${p}%`,
    waiting: "Waiting for interviews", open: "Open",
    excerpts: "Transcript excerpts",
    moments: ["I buy it for the piece, not for the story.", "Three colours, not five: black will sell.", "At that price, I want to see the stitching up close."],
    kicker: "Synthesis · Recycled leather goods", heading: "Recycled sells on the piece, not on the story",
    insights: [
      "\"Recycled\" reassures second-hand buyers, not full-price customers.",
      "Five colours dilute the line: three are enough, black drives sales.",
      "Full price works if the finish is flawless.",
    ],
    verbatim: "I buy it for the piece, not for the story.", cite: "Luxury shopper, 34",
    themes: ["Finish", "Price", "Eco messaging"],
  },
  decision: {
    board: "Product committee", when: "Monday · 9 am", source: "Source:",
    items: [
      { text: "Launch in three colours: black, cognac, sand", source: "5 of 6 interviews", label: "Decided" },
      { text: "Don't print \"recycled\" on the label", source: "4 of 6 interviews", label: "Decided" },
      { text: "Test €420 with six customers", source: "Open question from the synthesis", label: "To test" },
    ],
    tally: ["12 days", "from brief to committee", "interviews", "evidence-based decisions"],
    quotes: [
      { q: "Three colours, not five: black will sell.", who: "Luxury shopper, 34" },
      { q: "If it says recycled, I think second-hand.", who: "Boutique associate, 8 yrs" },
      { q: "At €420, I want to see the stitching up close.", who: "Savvy customer, 29" },
    ],
  },
};

export const FILM_COPY: Record<Lang, FilmCopy> = { fr: FR, en: EN };
