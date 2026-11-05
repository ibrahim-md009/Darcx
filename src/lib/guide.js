/* The brain of Dalil: turns a visitor's short question into an answer, using the site's own data (data.js).
   Package and project answers are built from data.packages / data.projects / data.extras, so they never go out of date.
   Fixed answers live in data.js → buddy.faq. Nothing here is invented: if the data does not say it, Dalil says to ask us.

   An answer is { text, acts: [{ label, to | href }], follow: [{ label, ask }] }:
   text = the sentence(s), acts = buttons that open a page / link, follow = suggested next questions (tap = ask it). */

import { KNOWLEDGE } from "../knowledge.js";

/* makes Arabic and English comparable: no diacritics, one spelling of alef / yaa / taa marbuta, lower case, no punctuation */
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------- understanding loose wording: stems, synonyms, typos ---------- */
const PREFIXES = ["وبال", "وال", "بال", "كال", "فال", "لل", "ال", "و", "ب", "ل", "ف", "ك"];
const SUFFIXES = ["كم", "كن", "نا", "ها", "هم", "هن", "ات", "ون", "ين", "ان", "ه", "ي", "ك"];
/* a rough root of a word: "اعمالكم" → "اعمال", "بالاعمال" → "اعمال" (only used to compare words, never shown) */
function stem(word) {
  let w = word;
  if (/^[a-z0-9]+$/.test(w)) return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w;
  for (const prefix of PREFIXES) if (w.startsWith(prefix) && w.length - prefix.length >= 3) { w = w.slice(prefix.length); break; }
  for (const suffix of SUFFIXES) if (w.endsWith(suffix) && w.length - suffix.length >= 3) { w = w.slice(suffix.length); break; }
  return w;
}

/* different ways of saying the same thing → the words the answers know. `add` is appended to the question when any `says` matches */
const SYNONYMS = [
  { says: ["شغلكم", "اشغالكم", "شغلاتكم", "شغلك", "نماذج", "نماذجكم", "انجازاتكم", "انجازات", "انجزتوه", "عملتوه", "عملتموه", "بنيتوه", "بنيتموه", "ماذا عملتم", "شو عملتو", "شو عملتوا", "شو بنيتو", "ماذا بنيتم", "ماذا صممتم", "تصاميمكم", "بورتفوليو", "بورتفوليو", "portfolio", "samples", "showcase", "case studies", "what have you done", "what did you make"], add: "اعمالكم اعمالنا مشاريعكم your work" },
  { says: ["اسعاركم", "بكم", "بكام", "بقديش", "قديش", "شقد", "بشكم", "كم بدفع", "كم ادفع", "كم السعر", "كم يكلف", "تسعيره", "رسوم", "pricing", "how much", "rates", "fees", "charge", "charges"], add: "اسعار الباقات price" },
  { says: ["كلمكم", "اكلمكم", "اراسلكم", "راسلكم", "اتواصل", "اتصل", "كلمني", "رقمكم", "ارقامكم", "ايميلكم", "بريدكم", "contact you", "reach you", "call you", "message you", "get in touch", "talk to you"], add: "التواصل معكم contact" },
  { says: ["اطلب", "احجز", "اشتري", "اشترك", "ابدا", "ابدء", "بدي موقع", "اريد موقع", "بدي تطبيق", "بدي نظام", "order", "buy", "subscribe", "get started", "start a project", "hire you", "hire"], add: "كيف اطلب order" },
  { says: ["متي يجهز", "كم يوم", "كم اسبوع", "كم يستغرق", "وقت التنفيذ", "how soon", "how fast", "turnaround", "deadline", "how many days"], add: "مده التنفيذ delivery" },
  { says: ["خدماتكم", "شو بتقدمو", "شو بتقدموا", "ماذا تقدمون", "ماذا تفعلون", "شو بتعملو", "شو بتشتغلو", "شو شغلكم", "شو تخصصكم", "تخصصكم", "what do you do", "what you offer", "what you do", "your services"], add: "الخدمات services" },
  { says: ["عروضكم", "تخفيضات", "تنزيلات", "خصومات", "خصم", "كوبون", "تخفيض", "discount", "deal", "deals", "sale", "coupon", "promo"], add: "العروض offers" },
  { says: ["مساعده", "ساعدني", "ما افهم", "اشرحلي", "ماذا افعل", "حيرت", "تايه", "help me", "i'm lost", "guide me", "i need help"], add: "ساعدني help" },
  { says: ["مبرمجين", "مطورين", "فريقكم", "من وراء", "اصحاب الموقع", "who made", "who built", "developers", "your team"], add: "من نحن about" },
];

const STOP = new Set(["هل", "ما", "ماذا", "كيف", "في", "من", "علي", "عن", "الي", "انا", "انت", "هو", "هي", "لا", "نعم", "بدي", "اريد", "عندكم", "عندي", "هذا", "هذه", "ذلك", "شو", "ايش", "وين", "ليش", "لماذا", "كم", "اي", "ايه", "ثم", "او", "مع", "the", "is", "are", "you", "your", "what", "how", "do", "does", "can", "i", "me", "my", "a", "an", "of", "to", "in", "on", "for", "and", "or", "it", "this", "that", "with", "about", "have", "has"]);

/* "another one", "more", "again" – asking for more of the last answer */
const MORE = new Set(["كمان", "كمل", "زيد", "زدني", "زيدني", "اخري", "اخر", "غيرها", "غيره", "ثانيه", "تاني", "تانيه", "مره", "تكمله", "واحده", "واحد", "again", "more", "another", "next", "other", "else", "continue"]);
const FILL = new Set(["قول", "قولي", "احكي", "احكيلي", "هات", "هاتلي", "اعطني", "اعطيني", "بدي", "اريد", "لي", "لنا", "فضلك", "سمحت", "ممكن", "و", "ثم", "tell", "give", "me", "please", "can", "you", "i", "want", "a", "an", "the", "some", "one", "and", "say", "show", "now", "هيك", "كده"]);
const isMore = words => words.length > 0 && words.length <= 5 && words.every(w => MORE.has(w) || FILL.has(w)) && words.some(w => MORE.has(w));

function distance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (row[j] < low) low = row[j];
    }
    if (low > limit) return limit + 1;
    prev = row;
  }
  return prev[b.length];
}

/* how well a question matches a list of keys: longer (more specific) keys weigh more; very short keys must be whole words */
function score(text, words, keys) {
  let total = 0;
  for (const raw of keys) {
    const key = normalize(raw);
    if (!key) continue;
    const whole = key.length <= 3 && !key.includes(" ");
    if (whole ? words.includes(key) : text.includes(key)) total += key.length;
  }
  return total;
}

/* what a visitor may want to know about one project / one package (words to look for) */
const TOPICS = {
  features: ["ميزات", "مميزات", "ميزه", "يقدم", "يعمل", "وظائف", "وظيفه", "يشمل", "features", "feature", "offers", "what does", "includes"],
  tech: ["تقني", "بني", "مبني", "برمج", "تصميم بـ", "react", "tech", "built", "stack", "made with", "technolog"],
  view: ["رابط", "شاهد", "اشاهد", "زيار", "افتح", "اشوف", "شوف", "link", "visit", "open", "live", "demo", "view", "see"],
  story: ["مشكله", "المشكله", "حل", "problem", "solution", "challenge"],
  price: ["سعر", "اسعار", "كم", "ثمن", "تكلف", "تكلفه", "price", "cost", "much", "pay"],
  time: ["مده", "وقت", "يوم", "ايام", "تسليم", "متي", "تستغرق", "delivery", "long", "time", "days", "deliver", "when"],
  support: ["دعم", "صيانه", "support", "maintenance"],
};

/* project aliases that are not in the project's name */
const ALIASES = { "keo-studio": ["keo", "كيو"], "pos-system": ["pos", "cashier", "كاشير", "نقاط البيع", "نقاط بيع"], "Booking system": ["booking"] };

/* keys of the "extras" (sold separately) */
const EXTRA_KEYS = {
  hosting: ["نطاق", "دومين", "استضافه", "هوست", "domain", "hosting", "host"],
  maintenance: ["صيانه", "دعم فني", "maintenance", "technical support"],
  changes: ["تعديلات اضافيه", "تعديل بعد", "بعد التسليم", "after delivery", "after launch", "additional modifications"],
  seo: ["سيو", "محركات البحث", "seo", "search engine", "google ranking"],
  content: ["كتابه محتوي", "محتوي", "نصوص", "content writing", "copywriting", "content"],
};

export function makeGuide(data, lang) {
  const buddy = data.buddy;
  const L = (ar, en) => (lang === "ar" ? ar : en);
  const loc = value => (value && typeof value === "object" ? value[lang] ?? "" : value ?? "");
  const list = lines => lines.map(line => "• " + line).join("\n");
  const wa = data.contact?.whatsapp;
  const waLink = message => (wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(message) : null);
  const fill = (template, pkg) => loc(template).replace("{price}", pkg.price).replace("{original}", pkg.original);
  const packages = data.packages || [];
  const projects = data.projects || [];
  const extras = data.extras || [];
  const withFeature = (pkg, pattern) => (loc({ [lang]: pkg.features?.[lang]?.find(feature => pattern.test(feature)) }) || null);
  const priceText = pkg =>
    pkg.offer ? L(`${pkg.price}$ بدل ${pkg.original}$ (سعر الإطلاق)`, `$${pkg.price} instead of $${pkg.original} (launch price)`) : `${pkg.price}$`.replace(/^(\d+)\$$/, lang === "ar" ? "$1$" : "$$$1");
  /* a list of answers = several variants: they come in a shuffled order and none repeats until all were used */
  const bags = new Map(), lastPick = new Map();
  const pickVariant = (owner, variants) => {
    if (!Array.isArray(variants)) return variants;
    if (variants.length < 2) return variants[0];
    let bag = bags.get(owner) || [];
    if (!bag.length) {
      bag = variants.map((_, i) => i).filter(i => i !== lastPick.get(owner));
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    }
    const index = bag.pop();
    bags.set(owner, bag); lastPick.set(owner, index);
    return variants[index];
  };
  const waAct = text => (wa ? [{ label: loc(buddy.waLabel), href: waLink(text) }] : []);

  const pageActs = (to, label) => [{ to, label }];
  const goServices = pageActs("/services", L("افتح الباقات", "Open packages"));

  /* ---------- projects ---------- */
  const projectName = project => loc(project.name);
  const projectFollow = project => [
    { label: L(`ما مميزات ${projectName(project)}؟`, `What does ${projectName(project)} offer?`), ask: L(`ما مميزات ${projectName(project)}؟`, `What does ${projectName(project)} offer?`) },
    { label: L(`بماذا بُني ${projectName(project)}؟`, `What is ${projectName(project)} built with?`), ask: L(`بماذا بُني ${projectName(project)}؟`, `What is ${projectName(project)} built with?`) },
    { label: L(`أين أشاهد ${projectName(project)}؟`, `Where can I view ${projectName(project)}?`), ask: L(`أين أشاهد ${projectName(project)}؟`, `Where can I view ${projectName(project)}?`) },
  ];
  const projectsFollow = () => projects.map(project => ({ label: projectName(project), ask: L(`حدثني عن ${projectName(project)}`, `Tell me about ${projectName(project)}`) }));

  function projectKeys(project) {
    return [loc({ ar: project.name?.ar, en: "" }), project.name?.ar, project.name?.en, String(project.slug).replace(/-/g, " "), ...(ALIASES[project.slug] || []), ...(project.alias || [])].filter(Boolean);
  }

  function projectAnswer(project, text, words) {
    const name = projectName(project);
    const page = pageActs("/projects/" + project.slug, L(`صفحة ${name}`, `${name} page`));
    const topic = Object.entries({ story: TOPICS.story, features: TOPICS.features, tech: TOPICS.tech, view: TOPICS.view })
      .map(([id, keys]) => [id, score(text, words, keys)]).sort((a, b) => b[1] - a[1])[0];
    const kind = topic[1] > 0 ? topic[0] : "overview";
    const more = projectFollow(project);
    if (kind === "features") {
      const items = project.features?.[lang] || [];
      return { text: L(`مميزات ${name}:\n`, `What ${name} offers:\n`) + list(items), acts: page, follow: [more[1], more[2]] };
    }
    if (kind === "tech") {
      const tech = project.tech || [];
      const byKind = project.kind === "system"
        ? L(`${name} برنامج مبني بـ Flutter ولغة Dart 📱`, `${name} is a program built with Flutter and the Dart language 📱`)
        : L(`${name} موقع مبني بتقنيات الويب، وعلى رأسها React ⚛️`, `${name} is a website built with web technologies, mainly React ⚛️`);
      const known = tech.length
        ? L(`${name} مبني باستخدام: ${tech.join("، ")} 🛠️`, `${name} is built with: ${tech.join(", ")} 🛠️`)
        : byKind;
      return { text: known, acts: [...page, ], follow: [more[0], more[2]] };
    }
    if (kind === "view") {
      const acts = [...page];
      if (project.link) acts.push({ label: L("زيارة العمل مباشرة", "Visit it live"), href: project.link });
      return { text: project.link ? L(`تستطيع فتح ${name} مباشرة، أو قراءة تفاصيله ولقطات شاشاته في صفحته 👀`, `You can open ${name} live, or read its details and screenshots on its page 👀`) : L(`تفاصيل ${name} ولقطات شاشاته في صفحته 👀`, `The details and screenshots of ${name} are on its page 👀`), acts, follow: [more[0], more[1]] };
    }
    if (kind === "story" && (project.problem || project.solution)) {
      return { text: [loc(project.problem), loc(project.solution)].filter(Boolean).join("\n\n"), acts: page, follow: [more[0], more[1]] };
    }
    return {
      text: `${name} (${loc(project.cat)})\n${loc(project.desc) || loc(project.short)}`,
      acts: page,
      follow: more,
    };
  }

  /* ---------- packages ---------- */
  const packageKeys = pkg => [
    "باقه " + loc({ ar: pkg.name?.ar }), "الباقه " + loc({ ar: pkg.name?.ar }),
    pkg.name?.en, pkg.name?.en && pkg.name.en + " package", pkg.id === "starter" ? "الانطلاق" : "", pkg.id === "custom" ? "حلول مخصصه" : "", pkg.id === "business" && "business",
  ].filter(Boolean);
  const packagesFollow = () => packages.map(pkg => ({ label: loc(pkg.name), ask: L(`ماذا تشمل باقة ${pkg.name.ar}؟`, `What does the ${pkg.name.en} package include?`) }));

  function packageAnswer(pkg, text, words) {
    const name = loc(pkg.name);
    const order = pkg.wa && wa ? [{ label: loc(pkg.cta), href: waLink(fill(pkg.wa, pkg)) }] : [];
    const asked = Object.entries({ price: TOPICS.price, time: TOPICS.time, support: TOPICS.support }).map(([id, keys]) => [id, score(text, words, keys)]).sort((a, b) => b[1] - a[1])[0];
    const topic = asked[1] > 0 ? asked[0] : "all";
    const others = packages.filter(other => other !== pkg).map(other => ({ label: loc(other.name), ask: L(`ماذا تشمل باقة ${other.name.ar}؟`, `What does the ${other.name.en} package include?`) }));
    if (topic === "price") {
      const note = pkg.offer ? "" : L("\nوبما أنها مبنية حسب متطلباتك، نناقش تفاصيل مشروعك معك أولًا 💬", "\nSince it is built around your requirements, we first discuss your project's details with you 💬");
      return { text: L(`باقة ${name}: ${priceText(pkg)} 🎁`, `${name} package: ${priceText(pkg)} 🎁`) + note, acts: [...goServices, ...order], follow: others.slice(0, 2) };
    }
    if (topic === "time") {
      const line = withFeature(pkg, /التسليم|Delivery/i);
      return { text: line ? L(`باقة ${name}: ${line} ⏱️`, `${name} package: ${line} ⏱️`) : L(`مدة تنفيذ باقة ${name} نتفق عليها معك بحسب نطاق مشروعك ⏱️`, `The timeline for the ${name} package is agreed with you according to your project's scope ⏱️`), acts: order, follow: others.slice(0, 2) };
    }
    if (topic === "support") {
      const line = withFeature(pkg, /دعم|support/i);
      return { text: line ? L(`باقة ${name}: ${line} 🤝`, `${name} package: ${line} 🤝`) : L(`باقة ${name} لا تتضمن فترة دعم مجاني، لكن «صيانة الموقع والدعم الفني» متاحة كخدمة منفصلة 🤝`, `The ${name} package doesn't include a free support period, but "Website maintenance and technical support" is available as a separate service 🤝`), acts: goServices, follow: others.slice(0, 2) };
    }
    return {
      text: `${L("باقة", "")} ${name}${L("", " package")} — ${priceText(pkg)}\n${loc(pkg.desc)}\n${list(pkg.features?.[lang] || [])}`.trim(),
      acts: [...goServices, ...order],
      follow: others.slice(0, 2),
    };
  }

  /* ---------- general answers built from the data ---------- */
  const packagesOverview = () => ({
    text: L("باقاتنا:\n", "Our packages:\n") + list(packages.map(pkg => `${loc(pkg.name)}: ${priceText(pkg)}`)) + L("\nاضغط على أي باقة لأخبرك بما تشمله 👇", "\nTap a package to see what it includes 👇"),
    acts: goServices,
    follow: packagesFollow(),
  });
  const modifyAnswer = () => {
    const rounds = packages.map(pkg => {
      const line = withFeature(pkg, /جولات|جولتان|revisions/i);
      return `${loc(pkg.name)}: ${line || L("مبنية حسب المتطلبات المتفق عليها", "built around the agreed requirements")}`;
    });
    const later = extras.find(extra => extra.id === "changes");
    return {
      text: L("نعم، التعديل ممكن 👍\n", "Yes, changes are possible 👍\n") + list(rounds)
        + L("\nولو أردت شيئًا خارج الباقة (ميزة أو صفحات إضافية) ناقشه معنا عبر واتساب قبل البدء لنرى الممكن.", "\nIf you want something outside a package (a feature or extra pages), talk to us on WhatsApp before we start so we can see what's possible.")
        + (later ? L(`\nوبعد التسليم تتوفر خدمة «${loc(later.name)}» بشكل منفصل.`, `\nAfter delivery, "${loc(later.name)}" is available as a separate service.`) : ""),
      acts: [...goServices, ...waAct(L("مرحباً فريق DARCX، أريد الاستفسار عن التعديل على إحدى الباقات.", "Hello DARCX team, I'd like to ask about customising a package."))],
      follow: [],
    };
  };
  const deliveryAnswer = () => ({
    text: L("مدة التسليم:\n", "Delivery time:\n") + list(packages.map(pkg => {
      const line = withFeature(pkg, /التسليم|Delivery/i);
      return `${loc(pkg.name)}: ${line ? line.replace(/^(التسليم خلال|Delivery within)\s*/i, "") : L("حسب نطاق المشروع المتفق عليه", "according to the agreed project scope")}`;
    })) + " ⏱️",
    acts: goServices,
    follow: [],
  });
  const supportAnswer = () => ({
    text: L("الدعم بعد التسليم:\n", "Support after delivery:\n") + list(packages.map(pkg => {
      const line = withFeature(pkg, /دعم|support/i);
      return `${loc(pkg.name)}: ${line || L("لا يوجد دعم مجاني ضمن الباقة، ويمكنك طلب خدمة الصيانة والدعم الفني منفصلة", "no free support included; you can order maintenance and technical support separately")}`;
    })) + " 🤝",
    acts: goServices,
    follow: [],
  });
  const extrasAnswer = extra => ({
    text: `${loc(extra.name)}\n${loc(extra.desc)}\n${extra.price ? L("السعر: ", "Price: ") + extra.price : L("خدمة منفصلة عن الباقات، والسعر عند التواصل معنا 💬", "A separate service from the packages; the price is given when you contact us 💬")}`,
    acts: [...goServices, ...waAct(L(`مرحباً فريق DARCX، أريد الاستفسار عن خدمة «${loc(extra.name)}».`, `Hello DARCX team, I'd like to ask about "${loc(extra.name)}".`))],
    follow: [],
  });
  const extrasOverview = () => ({
    text: L("خدمات إضافية تُطلب بشكل منفصل:\n", "Extra services, ordered separately:\n") + list(extras.map(extra => loc(extra.name))),
    acts: goServices,
    follow: extras.slice(0, 3).map(extra => ({ label: loc(extra.name), ask: loc(extra.name) })),
  });
  const projectsOverview = () => ({
    text: L(`أنجزنا ${projects.length} أعمال، بين مواقع وأنظمة:\n`, `We've built ${projects.length} projects, websites and systems:\n`) + list(projects.map(project => `${projectName(project)}: ${loc(project.short)}`)) + L("\nاختر عملًا لأخبرك عنه 👇", "\nPick one and I'll tell you about it 👇"),
    acts: pageActs("/projects", L("افتح الأعمال", "Open projects")),
    follow: projectsFollow(),
  });

  /* contact channels written in data.contact (empty ones are skipped) */
  const channelUrls = {
    instagram: ["Instagram", v => "https://instagram.com/" + v],
    facebook: ["Facebook", v => "https://facebook.com/" + v],
    telegram: ["Telegram", v => "https://t.me/" + v],
    linkedin: ["LinkedIn", v => "https://linkedin.com/company/" + v],
    x: ["X", v => "https://x.com/" + v],
    tiktok: ["TikTok", v => "https://tiktok.com/@" + v],
  };
  const socialAnswer = () => {
    const acts = Object.entries(channelUrls).filter(([id]) => data.contact?.[id]).map(([id, [label, url]]) => ({ label, href: url(data.contact[id]) }));
    if (wa) acts.unshift({ label: loc(buddy.waLabel), href: waLink("") });
    return { text: L("هذه قنوات التواصل المتاحة، اختر ما يناسبك 📲", "Here are the ways to reach us, pick what suits you 📲") + (data.contact?.email ? L(`\nالبريد: ${data.contact.email}`, `\nEmail: ${data.contact.email}`) : ""), acts, follow: [] };
  };
  const clock = () => new Date().toLocaleTimeString(lang === "ar" ? "ar" : "en", { hour: "2-digit", minute: "2-digit" });
  const today = () => new Date().toLocaleDateString(lang === "ar" ? "ar" : "en", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  /* a small calculator: "5*3", "كم يساوي 12 + 7" */
  const calc = question => {
    const match = String(question).replace(/[×x]/g, "*").replace(/÷/g, "/").replace(/،/g, ".").match(/\d[\d.\s]*(?:[-+*/]\s*\(?\s*\d[\d.\s]*\)?\s*)+/);
    if (!match || !/[-+*/]/.test(match[0])) return null;
    const expression = match[0].replace(/\s+/g, "");
    if (!/^[\d.+\-*/()]+$/.test(expression) || expression.length > 40) return null;
    try {
      const value = Function('"use strict"; return (' + expression + ")")();
      if (!Number.isFinite(value)) return null;
      return { text: `${expression.replace(/\*/g, "×").replace(/\//g, "÷")} = ${Math.round(value * 1e6) / 1e6} 🧮`, acts: [], follow: [] };
    } catch { return null; }
  };

  const servicesAnswer = () => ({
    text: L("ما نقدمه:\n", "What we do:\n") + list((data.serviceCards || []).map(card => `${loc(card.name)}: ${loc(card.desc)}`)),
    acts: goServices,
    follow: packagesFollow(),
  });
  const techAnswer = () => ({
    text: L("مواقعنا (الويب) نبنيها بتقنيات الويب وعلى رأسها React ⚛️، وبرامجنا وتطبيقاتنا بـ Flutter ولغة Dart 📱\nكل ما نستخدمه: ", "We build our websites with web technologies, mainly React ⚛️, and our programs and apps with Flutter and Dart 📱\nEverything we use: ") + (data.stack || []).join(L("، ", ", ")) + " 🛠️",
    acts: pageActs("/about", L("من نحن", "About us")),
    follow: [],
  });
  const recommendAnswer = () => {
    const featured = packages.find(pkg => pkg.id === data.featuredPackage);
    return {
      text: L("اختر بحسب حاجتك:\n", "Pick by what you need:\n") + list(packages.map(pkg => `${loc(pkg.name)}: ${loc(pkg.desc)}`))
        + (featured ? L(`\nالأكثر اختيارًا على الموقع: باقة ${loc(featured.name)} ⭐`, `\nThe highlighted choice on the site: the ${loc(featured.name)} package ⭐`) : ""),
      acts: [...goServices, ...waAct(L("مرحباً فريق DARCX، أحتاج مساعدة في اختيار الباقة المناسبة.", "Hello DARCX team, I need help choosing the right package."))],
      follow: packagesFollow(),
    };
  };
  const offerAnswer = () => {
    const offers = packages.filter(pkg => pkg.offer);
    if (!offers.length) return { text: L("لا يوجد عرض معلن حاليًا، لكن أسعار الباقات مكتوبة في صفحة الخدمات 🎁", "There's no announced offer right now, but package prices are written on the Services page 🎁"), acts: goServices, follow: [] };
    return {
      text: L("أسعار الإطلاق الحالية 🎁\n", "Current launch prices 🎁\n") + list(offers.map(pkg => L(`${loc(pkg.name)}: ${pkg.price}$ بدل ${pkg.original}$ (وفّر ${pkg.original - pkg.price}$)`, `${loc(pkg.name)}: $${pkg.price} instead of $${pkg.original} (save $${pkg.original - pkg.price})`))),
      acts: goServices,
      follow: [],
    };
  };
  const numberAnswer = () => ({
    text: L(`رقم واتساب: +${wa} 📱`, `WhatsApp number: +${wa} 📱`) + (data.contact?.email ? L(`\nالبريد: ${data.contact.email}`, `\nEmail: ${data.contact.email}`) : ""),
    acts: waAct(L("مرحباً فريق DARCX.", "Hello DARCX team.")),
    follow: [],
  });

  /* generated entries: keys + the answer to give */
  const generated = [
    { keys: ["الباقات", "ما الباقات", "انواع الباقات", "كم باقه", "الفرق بين", "packages", "plans", "what packages", "difference between"], make: packagesOverview, q: L("ما الباقات المتوفرة؟", "What packages do you offer?"), rank: 2 },
    { keys: ["سعر", "اسعار", "بكم", "تكلف", "كم سعر", "price", "prices", "pricing", "cost", "how much"], make: () => ({ ...packagesOverview(), text: L("الأسعار (سعر الإطلاق الحالي):\n", "Prices (current launch prices):\n") + list(packages.map(pkg => `${loc(pkg.name)}: ${priceText(pkg)}`)) + L("\nاضغط على باقة لتفاصيلها 👇", "\nTap a package for its details 👇") }), q: L("كم الأسعار؟", "How much does it cost?"), rank: 3 },
    { keys: ["التعديل علي", "تعديل علي", "اعدل", "اضافه صفحات", "اضافه صفحه", "زياده صفحات", "ميزه جديده", "اضيف", "add pages", "add a page", "extra pages", "add a feature", "new feature", "يمكن التعديل", "امكانيه التعديل", "تعديل", "عدل", "غير", "تغيير", "تخصيص", "خصص", "اضافه ميزه", "can i customize", "can i customise", "can packages", "customize", "customise", "modify", "modification", "change", "edit", "adjust", "tweak"], make: modifyAnswer, q: L("هل يمكن التعديل على الباقات؟", "Can packages be customised?"), rank: 4 },
    { keys: ["مده التسليم", "كم يستغرق", "كم تستغرق", "متي استلم", "تسليم", "مده", "delivery", "how long", "turnaround", "timeline"], make: deliveryAnswer, q: L("كم مدة التسليم؟", "How long does delivery take?"), rank: 5 },
    { keys: ["دعم", "بعد التسليم", "مشكله بعد", "support after", "after delivery", "after launch", "support"], make: supportAnswer, q: L("هل يوجد دعم بعد التسليم؟", "Is there support after delivery?"), rank: 6 },
    { keys: ["الاعمال التي", "ماذا انجزتم", "اعمالكم", "مشاريعكم", "ما هي اعمالكم", "اي مشاريع", "what have you built", "your projects", "your work", "portfolio"], make: projectsOverview, q: L("ما الأعمال التي أنجزتموها؟", "What have you built?"), rank: 8 },
    { keys: ["خدمات اضافيه", "خدمات اخري", "اضافات", "extra services", "extras", "add ons", "additional services"], make: extrasOverview, q: L("هل لديكم خدمات إضافية؟", "Do you offer extra services?"), rank: 9 },
    { keys: ["ما الخدمات", "ماذا تقدمون", "شو بتقدمو", "خدماتكم", "ايش تعملون", "ماذا تعملون", "what services", "what do you offer", "your services", "what do you do"], make: servicesAnswer, q: L("ما الخدمات التي تقدمونها؟", "What services do you offer?"), rank: 10 },
    { keys: ["انسب باقه", "اي باقه", "ايش الباقه المناسبه", "اي باقه اختار", "ساعدني اختار", "ما الباقه المناسبه", "which package", "best package", "recommend", "which plan", "help me choose"], make: recommendAnswer, q: L("أي باقة تناسبني؟", "Which package suits me?"), rank: 11 },
    { keys: ["عرض الاطلاق", "عروض", "خصم", "تخفيض", "launch offer", "discount", "offers", "sale", "promotion"], make: offerAnswer, q: L("هل يوجد عرض أو خصم؟", "Is there an offer or discount?"), rank: 12 },
    { keys: ["ما التقنيات", "التقنيات", "بماذا تبنون", "بايش بتبنو", "tech stack", "technologies", "what do you build with", "which technologies"], make: techAnswer, q: L("ما التقنيات التي تستخدمونها؟", "What technologies do you use?"), rank: 13, bonus: 8 },
    { keys: ["رقمكم", "رقم الواتساب", "رقم واتساب", "رقم التواصل", "اعطني رقم", "your number", "phone number", "whatsapp number", "your email", "ايميلكم"], make: numberAnswer, q: null, bonus: 12 },
    { keys: ["انستغرام", "انستا", "فيسبوك", "تلغرام", "لينكدان", "سوشيال", "حساباتكم", "instagram", "facebook", "telegram", "linkedin", "social media", "social", "your accounts"], make: socialAnswer, q: null },
    { keys: ["كم الساعه", "الساعه كم", "كم الوقت", "الوقت الان", "what time", "current time", "time is it"], make: () => ({ text: L(`الساعة الآن ${clock()} 🕒 (حسب جهازك)`, `It's ${clock()} now 🕒 (by your device)`), acts: [], follow: [] }), q: null },
    { keys: ["تاريخ اليوم", "ما التاريخ", "اي يوم اليوم", "ما هو اليوم", "what date", "today's date", "what day is", "todays date"], make: () => ({ text: L(`اليوم ${today()} 📅`, `Today is ${today()} 📅`), acts: [], follow: [] }), q: null },
    ...extras.map(extra => ({ keys: EXTRA_KEYS[extra.id] || [], make: () => extrasAnswer(extra), q: null })),
  ];

  /* ---------- the fixed answers from data.js ---------- */
  const fixed = (buddy.faq || []).map(entry => ({
    id: entry.id, keys: entry.keys, q: entry.q ? loc(entry.q) : null,
    make: () => {
      const acts = [];
      if (entry.go) acts.push({ to: entry.go.to, label: loc(entry.go.label) });
      if (entry.wa && wa) acts.push({ label: loc(buddy.waLabel), href: waLink("") });
      const follow = entry.follow === "projects" ? projectsFollow() : entry.follow === "packages" ? packagesFollow() : [];
      const answer = pickVariant(entry, entry.a?.[lang] ?? loc(entry.a));
      return { text: answer, acts, follow };
    },
  }));

  /* general and site knowledge (knowledge.js): answerable, never shown as chips */
  const known = KNOWLEDGE.map(entry => ({
    keys: entry.keys, q: null, bonus: entry.bonus || 0,
    make: () => {
      const acts = [];
      if (entry.go) acts.push({ to: entry.go.to, label: loc(entry.go.label) });
      if (entry.wa && wa) acts.push({ label: loc(buddy.waLabel), href: waLink("") });
      const answer = pickVariant(entry, entry.a?.[lang] ?? loc(entry.a));
      return { text: answer, acts, follow: [], sound: entry.sound };
    },
  }));

  const fallback = () => ({ text: loc(buddy.fallback), acts: waAct(L("مرحباً فريق DARCX، لدي سؤال.", "Hello DARCX team, I have a question.")), follow: [] });

  /* ---------- the question → an answer ---------- */
  const entries = [...fixed, ...known, ...generated];
  const nameKeys = [...projects.flatMap(projectKeys), ...packages.flatMap(packageKeys)];
  const stemOf = new Map(); // a root of every word the answers know → the word
  const rootsOf = entry => new Set((entry.keys || []).flatMap(key => normalize(key).split(" ")).filter(w => w.length >= 3 && !STOP.has(w)).map(stem));
  const rootsCache = new Map();
  for (const key of [...entries.flatMap(entry => entry.keys || []), ...nameKeys]) for (const w of normalize(key).split(" ")) if (w.length >= 4 && !STOP.has(w)) stemOf.set(stem(w), w);

  let last = null; // the last answer that was understood: { make, text }

  /* a project or a package named in the question wins, then the best matching entry */
  function match(text) {
    const words = text.split(" ");
    const named = (items, keysOf) => items.map(item => [item, score(text, words, keysOf(item))]).filter(pair => pair[1] > 0).sort((a, b) => b[1] - a[1])[0];
    const project = named(projects, projectKeys), pkg = named(packages, packageKeys);
    if (project && (!pkg || project[1] >= pkg[1])) return { make: () => projectAnswer(project[0], text, words) };
    if (pkg) return { make: () => packageAnswer(pkg[0], text, words) };
    let best = null, bestScore = 0;
    for (const entry of entries) {
      const base = score(text, words, entry.keys || []);
      const points = base > 0 ? base + (entry.bonus || 0) : 0;
      if (points > bestScore) { best = entry; bestScore = points; }
    }
    return best ? { make: () => best.make() } : null;
  }

  /* second chance: fix typos, fold different wordings into the ones the answers know */
  function loosen(text) {
    const words = text.split(" ");
    const known = new Set(SYNONYMS.flatMap(group => group.says.flatMap(phrase => normalize(phrase).split(" "))));
    const fixedWords = words.map(w => {
      if (w.length < 5 || STOP.has(w) || known.has(w)) return w;
      const root = stem(w);
      if (stemOf.has(root)) return stemOf.get(root);
      const limit = w.length >= 9 ? 2 : 1;
      let bestWord = null, bestDistance = limit + 1;
      for (const [vocabRoot, vocab] of stemOf) {
        const d = Math.min(distance(root, vocabRoot, limit), distance(w, vocab, limit));
        if (d < bestDistance) { bestDistance = d; bestWord = vocab; }
      }
      return bestWord || w;
    });
    let out = fixedWords.join(" ");
    const roots = new Set([...fixedWords, ...words].map(stem)), padded = " " + out + " " + text + " ";
    for (const group of SYNONYMS) {
      const hit = group.says.some(phrase => {
        const norm = normalize(phrase);
        return norm.includes(" ") ? padded.includes(norm) : roots.has(stem(norm)) || padded.includes(" " + norm + " ");
      });
      if (hit) out += " " + normalize(group.add);
    }
    return out;
  }

  /* last chance: the entry that shares the most meaningful words with the question */
  function overlap(text) {
    const mine = text.split(" ").filter(w => w.length >= 3 && !STOP.has(w)).map(stem);
    let best = null, bestScore = 0;
    for (const entry of entries) {
      if (!rootsCache.has(entry)) rootsCache.set(entry, rootsOf(entry));
      const roots = rootsCache.get(entry);
      const points = mine.reduce((sum, w) => sum + (roots.has(w) ? w.length : 0), 0) + (points => points ? (entry.bonus || 0) / 4 : 0)(mine.some(w => roots.has(w)));
      if (points > bestScore) { best = entry; bestScore = points; }
    }
    return bestScore >= 4 ? best : null;
  }

  const remember = (found, answer) => { last = { make: found.make, text: answer.text }; return answer; };
  const noMore = () => ({ text: L("هذا كل ما عندي في هذا الموضوع 😊 اسألني عن شيء آخر، أو افتح الأسئلة الشائعة بالزر الصغير أعلى الحقل.", "That's all I have on this one 😊 Ask me something else, or open the common questions with the little button above the field."), acts: [], follow: [] });

  function reply(question) {
    const text = normalize(question);
    if (!text) return fallback();
    const sum = calc(question);
    if (sum) return sum;
    const words = text.split(" ");

    /* "another one", "more", "again": the last answer, a different variant if it has one */
    if (isMore(words)) {
      if (!last) return { text: L("كمان عن ماذا؟ 😄 اسألني سؤالًا أولًا ثم قل «كمان».", "More of what? 😄 Ask me something first, then say \"more\"."), acts: [], follow: [] };
      const again = last.make();
      if (again.text === last.text) return noMore();
      last.text = again.text;
      return again;
    }

    const found = match(text);
    if (found) return remember(found, found.make());

    const loose = match(loosen(text));
    if (loose) return remember(loose, loose.make());

    const close = overlap(loosen(text));
    if (close) {
      const answer = close.make();
      return remember({ make: () => close.make() }, { ...answer, text: L("أظنك تسأل عن هذا 🤔\n", "I think you're asking about this 🤔\n") + answer.text });
    }
    return fallback();
  }

  /* the common questions (the button above the field shows / hides them): the site's pages first, then the rest */
  const CHIP_GROUPS = [
    [L("ماذا في الصفحة الرئيسية؟", "What's on the home page?"), L("ماذا في صفحة الباقات والخدمات؟", "What's on the services page?"), L("ماذا في صفحة الأعمال؟", "What's on the projects page?"), L("ماذا في صفحة من نحن؟", "What's on the about page?"), L("ماذا في صفحة التواصل؟", "What's on the contact page?")],
    [L("كيف أطلب باقة؟", "How do I order a package?"), L("ما أسعار الباقات؟", "What are the package prices?"), L("ماذا تشمل باقة الأعمال؟", "What does the Business package include?"), L("أي باقة تناسبني؟", "Which package suits me?"), L("هل توجد عروض؟", "Are there any offers?"), L("كم يستغرق تنفيذ الموقع؟", "How long does a website take?"), L("هل الباقة تشمل الدومين والاستضافة؟", "Does the package include a domain and hosting?"), L("هل أقدر أعدل الموقع بنفسي؟", "Can I edit the site myself?")],
    [L("ما الأعمال التي أنجزتموها؟", "What have you built?"), L("ما تقنيات نظام نقاط البيع؟", "What technologies is the POS system built with?"), L("ما التقنيات التي تستخدمونها؟", "What technologies do you use?"), L("ما الفرق بين الموقع والبرنامج؟", "What's the difference between a website and a program?")],
    [L("من أنتم؟", "Who are you?"), L("كيف أتواصل معكم؟", "How can I contact you?"), L("هل الموقع بلغتين؟", "Is the site in two languages?"), L("موقع أم تطبيق؟", "Website or app?"), L("كيف أجذب عملاء؟", "How do I get customers?"), L("ما الفرق بين الدومين والاستضافة؟", "Domain vs hosting?")],
    [L("قل نكتة", "Tell me a joke"), L("أخبرني معلومة", "Tell me a fun fact"), L("كم الساعة؟", "What time is it?")],
  ];
  const chips = () => CHIP_GROUPS.flat();

  return { reply, chips };
}
