/* Contact channels. Values come from `contact` in data.js — empty ones are hidden. */
export const ALL_CHANNELS = [
  {
    id: "whatsapp",
    label: (t) => t("c_wa"),
    href: (value) => "https://wa.me/" + value,
    show: (value) => "+" + value,
    dot: "var(--sage)",
    icon: (
      <>
        <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5z" />
        <path d="M9 8.8c.3 2.4 2.600 4.700 5.200 5.300l1-1.200-1.800-.9-.9.800c-.9-.4-1.700-1.200-2.100-2.100l.8-.9-.9-1.800z" />
      </>
    ),
  },

  {
    id: "email",
    label: (t) => t("c_mail"),
    href: (value) => "mailto:" + value,
    show: (value) => value,
    dot: "var(--sand)",
    icon: (
      <>
        <rect x="3.500" y="5.500" width="17" height="13" rx="2.500" />
        <path d="M4 8l8 5.500L20 8" />
      </>
    ),
  },

  {
    id: "phone",
    label: (t) => t("c_call"),
    href: (value) => "tel:" + value,
    show: (value) => value,
    dot: "var(--blue)",
    icon: (
      <>
        <path d="M5 4h4l1.500 4-2 1.300a11 11 0 0 0 5.200 5.200L15 12.500l4 1.500v4a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z" />
      </>
    ),
  },

  {
    id: "instagram",
    label: (t) => t("c_ig"),
    href: (value) => "https://instagram.com/" + value,
    show: (value) => "@" + value,
    dot: "var(--taupe)",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4.500" />
        <circle cx="12" cy="12" r="3.600" />
        <circle cx="16.800" cy="7.200" r=".6" />
      </>
    ),
  },

  {
    id: "telegram",
    label: (t) => t("c_tg"),
    href: (value) => "https://t.me/" + value,
    show: (value) => "@" + value,
    dot: "var(--blue)",
    icon: (
      <>
        <path d="M20.500 4.500L3.500 11l5 2 2 5.500 3-3.500 4.500 3.500z" />
        <path d="M8.500 13l8-5.500" />
      </>
    ),
  },
  {
    id: "facebook",
    label: (t) => "Facebook",
    href: (value) => "https://facebook.com/" + value,
    show: (value) => value,
    dot: "var(--blue)",
    icon: (
      <>
        <path d="M14 21v-8h2.700l.5-3.300H14V7.600c0-1 .4-1.600 1.700-1.600h1.600V3.200C17 3.100 16 3 14.900 3 12.500 3 11 4.400 11 7v2.700H8.300V13H11v8z" />
      </>
    ),
  },
  {
    id: "linkedin",
    label: (t) => "LinkedIn",
    href: (value) => "https://linkedin.com/company/" + value,
    show: (value) => value,
    dot: "var(--blue)",
    icon: (
      <>
        <rect x="4" y="9" width="3.500" height="11" />
        <circle cx="5.800" cy="5.500" r="1.800" />
        <path d="M10.500 20v-11h3.300v1.600c.6-1 1.800-1.900 3.400-1.900 2.800 0 3.800 1.800 3.800 4.600V20h-3.500v-5.800c0-1.300-.4-2.200-1.700-2.200s-2 1-2 2.300V20z" />
      </>
    ),
  },
  {
    id: "x",
    label: (t) => "X",
    href: (value) => "https://x.com/" + value,
    show: (value) => "@" + value,
    dot: "var(--taupe)",
    icon: (
      <>
        <path d="M4 4l16 16M20 4L4 20" />
      </>
    ),
  },
  {
    id: "tiktok",
    label: (t) => "TikTok",
    href: (value) => "https://tiktok.com/@" + value,
    show: (value) => "@" + value,
    dot: "var(--olive)",
    icon: (
      <>
        <path d="M14 4v11a3.500 3.500 0 1 1-3.500-3.500M14 4c.4 2.300 1.900 3.700 4.500 3.900" />
      </>
    ),
  },
];

/* only the channels that have a value in data.contact */
export const channels = (data) => ALL_CHANNELS.filter((channel) => data.contact[channel.id]);
