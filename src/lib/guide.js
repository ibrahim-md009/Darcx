/* The brain of Dalil: turns a visitor's short question into an answer, using the site's own data (data.js).
   Package and project answers are built from data.packages / data.projects / data.extras, so they never go out of date.
   Fixed answers live in data.js → buddy.faq. Nothing here is invented: if the data does not say it, Dalil says to ask us.

   An answer is { text, acts: [{ label, to | href }], follow: [{ label, ask }] }:
   text = the sentence(s), acts = buttons that open a page / link, follow = suggested next questions (tap = ask it). */

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
      const known = tech.length
        ? L(`${name} مبني باستخدام: ${tech.join("، ")} 🛠️`, `${name} is built with: ${tech.join(", ")} 🛠️`)
        : L(`لم نذكر التقنيات المستخدمة في ${name} على الموقع. اسألنا مباشرة وسنخبرك 💬`, `We haven't listed the technologies used for ${name} on the site. Ask us directly and we'll tell you 💬`);
      return { text: known, acts: [...page, ...(tech.length ? [] : waAct(L(`مرحباً، أريد معرفة التقنيات المستخدمة في ${name}.`, `Hello, I'd like to know which technologies were used for ${name}.`)))], follow: [more[0], more[2]] };
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

  /* generated entries: keys + the answer to give */
  const generated = [
    { keys: ["الباقات", "ما الباقات", "انواع الباقات", "كم باقه", "الفرق بين", "packages", "plans", "what packages", "difference between"], make: packagesOverview, q: L("ما الباقات المتوفرة؟", "What packages do you offer?"), rank: 2 },
    { keys: ["سعر", "اسعار", "بكم", "تكلف", "كم سعر", "price", "prices", "pricing", "cost", "how much"], make: () => ({ ...packagesOverview(), text: L("الأسعار (سعر الإطلاق الحالي):\n", "Prices (current launch prices):\n") + list(packages.map(pkg => `${loc(pkg.name)}: ${priceText(pkg)}`)) + L("\nاضغط على باقة لتفاصيلها 👇", "\nTap a package for its details 👇") }), q: L("كم الأسعار؟", "How much does it cost?"), rank: 3 },
    { keys: ["التعديل علي", "تعديل علي", "اعدل", "اضافه صفحات", "اضافه صفحه", "زياده صفحات", "ميزه جديده", "اضيف", "add pages", "add a page", "extra pages", "add a feature", "new feature", "يمكن التعديل", "امكانيه التعديل", "تعديل", "عدل", "غير", "تغيير", "تخصيص", "خصص", "اضافه ميزه", "can i customize", "can i customise", "can packages", "customize", "customise", "modify", "modification", "change", "edit", "adjust", "tweak"], make: modifyAnswer, q: L("هل يمكن التعديل على الباقات؟", "Can packages be customised?"), rank: 4 },
    { keys: ["مده التسليم", "كم يستغرق", "كم تستغرق", "متي استلم", "تسليم", "مده", "delivery", "how long", "turnaround", "timeline"], make: deliveryAnswer, q: L("كم مدة التسليم؟", "How long does delivery take?"), rank: 5 },
    { keys: ["دعم", "بعد التسليم", "مشكله بعد", "support after", "after delivery", "after launch", "support"], make: supportAnswer, q: L("هل يوجد دعم بعد التسليم؟", "Is there support after delivery?"), rank: 6 },
    { keys: ["الاعمال التي", "ماذا انجزتم", "اعمالكم", "مشاريعكم", "ما هي اعمالكم", "اي مشاريع", "what have you built", "your projects", "your work", "portfolio"], make: projectsOverview, q: L("ما الأعمال التي أنجزتموها؟", "What have you built?"), rank: 8 },
    { keys: ["خدمات اضافيه", "خدمات اخري", "اضافات", "extra services", "extras", "add ons", "additional services"], make: extrasOverview, q: L("هل لديكم خدمات إضافية؟", "Do you offer extra services?"), rank: 9 },
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
      const answer = Array.isArray(entry.a?.[lang]) ? entry.a[lang][Math.floor(Math.random() * entry.a[lang].length)] : loc(entry.a); // a list = several variants, one at random
      return { text: answer, acts, follow };
    },
  }));

  const fallback = () => ({ text: loc(buddy.fallback), acts: waAct(L("مرحباً فريق DARCX، لدي سؤال.", "Hello DARCX team, I have a question.")), follow: [] });

  /* ---------- the question → an answer ---------- */
  function reply(question) {
    const text = normalize(question);
    if (!text) return fallback();
    const words = text.split(" ");

    /* a project or a package named in the question wins */
    const named = (items, keysOf) => items.map(item => [item, score(text, words, keysOf(item))]).filter(pair => pair[1] > 0).sort((a, b) => b[1] - a[1])[0];
    const project = named(projects, projectKeys), pkg = named(packages, packageKeys);
    if (project && (!pkg || project[1] >= pkg[1])) return projectAnswer(project[0], text, words);
    if (pkg) return packageAnswer(pkg[0], text, words);

    let best = null, bestScore = 0;
    for (const entry of [...fixed, ...generated]) {
      const points = score(text, words, entry.keys || []);
      if (points > bestScore) { best = entry; bestScore = points; }
    }
    return best ? best.make() : fallback();
  }

  /* the question chips under the chat, in a sensible order */
  function chips() {
    const byId = id => fixed.find(entry => entry.id === id);
    const gen = rank => generated.find(entry => entry.rank === rank);
    return [byId("order"), gen(2), gen(3), gen(4), gen(5), gen(6), byId("works"), gen(8), gen(9), byId("contact"), byId("about"), byId("help"), byId("language")]
      .filter(entry => entry && entry.q)
      .map(entry => entry.q);
  }

  return { reply, chips };
}
