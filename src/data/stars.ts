import type { StarRecord } from "@/types/astronomy";

export const BRIGHT_STARS: StarRecord[] = [
  // Ursa Minor (小熊座)
  { id: "polaris", name: "Polaris (北极星)", raHours: 2.5303, decDegrees: 89.264, magnitude: 1.98, color: "#f6f4e9", constellation: "ursa-minor" },
  { id: "kochab", name: "Kochab (北极二)", raHours: 14.8451, decDegrees: 74.1555, magnitude: 2.07, color: "#ffd6a6", constellation: "ursa-minor" },
  { id: "pherkad", name: "Pherkad (北极一)", raHours: 15.3467, decDegrees: 71.834, magnitude: 3.0, color: "#eef3ff", constellation: "ursa-minor" },

  // Ursa Major (大熊座 / 北斗七星)
  { id: "dubhe", name: "Dubhe (天枢)", raHours: 11.0621, decDegrees: 61.751, magnitude: 1.79, color: "#ffd7a6", constellation: "ursa-major" },
  { id: "merak", name: "Merak (天璇)", raHours: 11.0307, decDegrees: 56.3824, magnitude: 2.37, color: "#d7e6ff", constellation: "ursa-major" },
  { id: "phecda", name: "Phecda (天玑)", raHours: 11.8972, decDegrees: 53.6948, magnitude: 2.44, color: "#d7e6ff", constellation: "ursa-major" },
  { id: "megrez", name: "Megrez (天权)", raHours: 12.257, decDegrees: 57.0326, magnitude: 3.31, color: "#d7e6ff", constellation: "ursa-major" },
  { id: "alioth", name: "Alioth (玉衡)", raHours: 12.9005, decDegrees: 55.9598, magnitude: 1.76, color: "#d7e6ff", constellation: "ursa-major" },
  { id: "mizar", name: "Mizar (开阳)", raHours: 13.3987, decDegrees: 54.9254, magnitude: 2.23, color: "#d7e6ff", constellation: "ursa-major" },
  { id: "alkaid", name: "Alkaid (摇光)", raHours: 13.7924, decDegrees: 49.3133, magnitude: 1.85, color: "#d7e6ff", constellation: "ursa-major" },

  // Cassiopeia (仙后座 - W形)
  { id: "schedar", name: "Schedar (王良四)", raHours: 0.6751, decDegrees: 56.5373, magnitude: 2.24, color: "#ffd5a0", constellation: "cassiopeia" },
  { id: "caph", name: "Caph (王良一)", raHours: 0.1529, decDegrees: 59.1497, magnitude: 2.28, color: "#fff5e3", constellation: "cassiopeia" },
  { id: "navi", name: "Navi (策)", raHours: 0.9453, decDegrees: 60.7167, magnitude: 2.15, color: "#dbe8ff", constellation: "cassiopeia" },
  { id: "ruchbah", name: "Ruchbah (阁道三)", raHours: 1.4285, decDegrees: 60.2353, magnitude: 2.68, color: "#e5eeff", constellation: "cassiopeia" },
  { id: "segin", name: "Segin (阁道二)", raHours: 1.9067, decDegrees: 63.6701, magnitude: 3.35, color: "#dce8ff", constellation: "cassiopeia" },

  // Summer Triangle & Cygnus (天鹅座 / 北天十字)
  { id: "deneb", name: "Deneb (天津四)", raHours: 20.6905, decDegrees: 45.2803, magnitude: 1.25, color: "#d8e7ff", constellation: "cygnus" },
  { id: "sadr", name: "Sadr (天津一)", raHours: 20.3703, decDegrees: 40.2567, magnitude: 2.23, color: "#fff2d4", constellation: "cygnus" },
  { id: "albireo", name: "Albireo (辇道增七)", raHours: 19.5126, decDegrees: 27.9597, magnitude: 3.05, color: "#ffe0a3", constellation: "cygnus" },
  { id: "gienah-cyg", name: "Gienah (天津九)", raHours: 20.7702, decDegrees: 33.9703, magnitude: 2.48, color: "#fff4df", constellation: "cygnus" },
  { id: "fawaris", name: "Fawaris (天津二)", raHours: 19.7492, decDegrees: 45.1308, magnitude: 2.86, color: "#dce8ff", constellation: "cygnus" },

  // Lyra (天琴座)
  { id: "vega", name: "Vega (织女一)", raHours: 18.6156, decDegrees: 38.7837, magnitude: 0.03, color: "#d8e8ff", constellation: "lyra" },
  { id: "sheliak", name: "Sheliak (渐台二)", raHours: 18.8344, decDegrees: 33.3627, magnitude: 3.52, color: "#dbe8ff", constellation: "lyra" },
  { id: "sulafat", name: "Sulafat (渐台三)", raHours: 18.9822, decDegrees: 32.6903, magnitude: 3.25, color: "#dbe8ff", constellation: "lyra" },
  { id: "delta2-lyr", name: "Delta2 Lyrae", raHours: 18.9101, decDegrees: 36.9001, magnitude: 4.22, color: "#ffb88a", constellation: "lyra" },
  { id: "epsilon-lyr", name: "Epsilon Lyrae", raHours: 18.7381, decDegrees: 39.6672, magnitude: 4.67, color: "#e0ebff", constellation: "lyra" },

  // Aquila (天鹰座)
  { id: "altair", name: "Altair (河鼓二 / 牛郎星)", raHours: 19.8464, decDegrees: 8.8683, magnitude: 0.77, color: "#fff7e6", constellation: "aquila" },
  { id: "tarazed", name: "Tarazed (河鼓三)", raHours: 19.7707, decDegrees: 10.6133, magnitude: 2.72, color: "#ffd6a6", constellation: "aquila" },
  { id: "alshain", name: "Alshain (河鼓一)", raHours: 19.9228, decDegrees: 6.4069, magnitude: 3.71, color: "#fff6dd", constellation: "aquila" },
  { id: "okab", name: "Okab (天鹰座双星)", raHours: 19.0898, decDegrees: 13.8622, magnitude: 2.99, color: "#dbe8ff", constellation: "aquila" },

  // Orion (猎户座)
  { id: "betelgeuse", name: "Betelgeuse (参宿四)", raHours: 5.9195, decDegrees: 7.407, magnitude: 0.5, color: "#ffb08a", constellation: "orion" },
  { id: "rigel", name: "Rigel (参宿七)", raHours: 5.2423, decDegrees: -8.2016, magnitude: 0.13, color: "#b9d4ff", constellation: "orion" },
  { id: "bellatrix", name: "Bellatrix (参宿五)", raHours: 5.4189, decDegrees: 6.3497, magnitude: 1.64, color: "#c6dcff", constellation: "orion" },
  { id: "saiph", name: "Saiph (参宿六)", raHours: 5.7959, decDegrees: -9.6696, magnitude: 2.09, color: "#bcd5ff", constellation: "orion" },
  { id: "alnitak", name: "Alnitak (参宿一)", raHours: 5.6793, decDegrees: -1.9426, magnitude: 1.74, color: "#bcd5ff", constellation: "orion" },
  { id: "alnilam", name: "Alnilam (参宿二)", raHours: 5.6036, decDegrees: -1.2019, magnitude: 1.69, color: "#bcd5ff", constellation: "orion" },
  { id: "mintaka", name: "Mintaka (参宿三)", raHours: 5.5334, decDegrees: -0.2991, magnitude: 2.23, color: "#bcd5ff", constellation: "orion" },

  // Canis Major & Minor (大犬座 & 小犬座)
  { id: "sirius", name: "Sirius (天狼星)", raHours: 6.7525, decDegrees: -16.7161, magnitude: -1.46, color: "#d8eaff", constellation: "canis-major" },
  { id: "adhara", name: "Adhara (弧矢七)", raHours: 6.9771, decDegrees: -28.9721, magnitude: 1.5, color: "#d8e8ff", constellation: "canis-major" },
  { id: "wezen", name: "Wezen (弧矢一)", raHours: 7.1398, decDegrees: -26.3932, magnitude: 1.83, color: "#fff2d4", constellation: "canis-major" },
  { id: "mirzam", name: "Mirzam (军市一)", raHours: 6.3783, decDegrees: -17.9559, magnitude: 1.98, color: "#d8e8ff", constellation: "canis-major" },
  { id: "procyon", name: "Procyon (南河三)", raHours: 7.655, decDegrees: 5.225, magnitude: 0.34, color: "#fff7df", constellation: "canis-minor" },

  // Taurus (金牛座)
  { id: "aldebaran", name: "Aldebaran (毕宿五)", raHours: 4.5987, decDegrees: 16.5093, magnitude: 0.85, color: "#ffb084", constellation: "taurus" },
  { id: "elnath", name: "Elnath (五车五)", raHours: 5.4382, decDegrees: 28.6075, magnitude: 1.65, color: "#c9ddff", constellation: "taurus" },
  { id: "tianguan", name: "Tianguan (天关)", raHours: 5.6274, decDegrees: 21.1425, magnitude: 2.97, color: "#cde0ff", constellation: "taurus" },
  { id: "ain", name: "Ain (毕宿一)", raHours: 4.4771, decDegrees: 19.1803, magnitude: 3.53, color: "#ffd6a6", constellation: "taurus" },
  { id: "hyadum1", name: "Hyadum I (毕宿四)", raHours: 4.3308, decDegrees: 15.6264, magnitude: 3.65, color: "#ffd9aa", constellation: "taurus" },

  // Gemini (双子座)
  { id: "pollux", name: "Pollux (北河三)", raHours: 7.7553, decDegrees: 28.026, magnitude: 1.14, color: "#ffdcb4", constellation: "gemini" },
  { id: "castor", name: "Castor (北河二)", raHours: 7.5767, decDegrees: 31.888, magnitude: 1.58, color: "#d9e7ff", constellation: "gemini" },
  { id: "alhena", name: "Alhena (井宿三)", raHours: 6.6285, decDegrees: 16.3992, magnitude: 1.93, color: "#e5eeff", constellation: "gemini" },
  { id: "wasat", name: "Wasat (天府增二)", raHours: 7.3348, decDegrees: 21.9822, magnitude: 3.5, color: "#fff7e4", constellation: "gemini" },
  { id: "mebsuta", name: "Mebsuta (井宿五)", raHours: 6.7328, decDegrees: 25.1311, magnitude: 3.06, color: "#fff3d8", constellation: "gemini" },
  { id: "tejat", name: "Tejat (井宿一)", raHours: 6.3828, decDegrees: 22.5097, magnitude: 2.87, color: "#ffba88", constellation: "gemini" },

  // Leo (狮子座)
  { id: "regulus", name: "Regulus (轩辕十四)", raHours: 10.1395, decDegrees: 11.967, magnitude: 1.4, color: "#d7e6ff", constellation: "leo" },
  { id: "denebola", name: "Denebola (五帝座一)", raHours: 11.8177, decDegrees: 14.572, magnitude: 2.14, color: "#d7e6ff", constellation: "leo" },
  { id: "algieba", name: "Algieba (轩辕十二)", raHours: 10.3329, decDegrees: 19.8415, magnitude: 2.28, color: "#ffd7a6", constellation: "leo" },
  { id: "zosma", name: "Zosma (西上相)", raHours: 11.2359, decDegrees: 20.5239, magnitude: 2.56, color: "#e5eeff", constellation: "leo" },
  { id: "chertan", name: "Chertan (西次相)", raHours: 11.2361, decDegrees: 15.4294, magnitude: 3.32, color: "#e5eeff", constellation: "leo" },

  // Scorpius (天蝎座)
  { id: "antares", name: "Antares (心宿二)", raHours: 16.4901, decDegrees: -26.432, magnitude: 1.09, color: "#ff9b75", constellation: "scorpius" },
  { id: "shaula", name: "Shaula (尾宿八)", raHours: 17.5601, decDegrees: -37.1038, magnitude: 1.62, color: "#c9ddff", constellation: "scorpius" },
  { id: "sargas", name: "Sargas (尾宿五)", raHours: 17.6224, decDegrees: -42.9978, magnitude: 1.86, color: "#fff3d8", constellation: "scorpius" },
  { id: "dschubba", name: "Dschubba (房宿三)", raHours: 16.0055, decDegrees: -22.6217, magnitude: 2.29, color: "#dce8ff", constellation: "scorpius" },
  { id: "acrab", name: "Acrab (房宿四)", raHours: 16.0906, decDegrees: -19.8053, magnitude: 2.56, color: "#dce8ff", constellation: "scorpius" },
  { id: "wei", name: "Wei (尾宿六)", raHours: 16.8365, decDegrees: -34.2936, magnitude: 2.29, color: "#ffd9aa", constellation: "scorpius" },
  { id: "lesath", name: "Lesath (尾宿九)", raHours: 17.5126, decDegrees: -37.2961, magnitude: 2.7, color: "#dce8ff", constellation: "scorpius" },

  // Sagittarius (人马座 / 银心茶壶)
  { id: "kaus-australis", name: "Kaus Australis (箕宿三)", raHours: 18.4029, decDegrees: -34.3846, magnitude: 1.85, color: "#c9ddff", constellation: "sagittarius" },
  { id: "nunki", name: "Nunki (斗宿四)", raHours: 18.9211, decDegrees: -26.2967, magnitude: 2.05, color: "#d8e8ff", constellation: "sagittarius" },
  { id: "ascella", name: "Ascella (斗宿一)", raHours: 19.0433, decDegrees: -29.8801, magnitude: 2.6, color: "#d8e8ff", constellation: "sagittarius" },
  { id: "kaus-media", name: "Kaus Media (箕宿二)", raHours: 18.3497, decDegrees: -29.8281, magnitude: 2.72, color: "#ffd6a6", constellation: "sagittarius" },
  { id: "kaus-borealis", name: "Kaus Borealis (斗宿二)", raHours: 18.4663, decDegrees: -25.4214, magnitude: 2.82, color: "#ffd6a6", constellation: "sagittarius" },
  { id: "alnasl", name: "Alnasl (箕宿一)", raHours: 18.0967, decDegrees: -30.4244, magnitude: 2.98, color: "#ffd6a6", constellation: "sagittarius" },

  // Southern Skies & Crux (南十字座 & 半人马座)
  { id: "acrux", name: "Acrux (十字架二)", raHours: 12.4433, decDegrees: -63.099, magnitude: 0.77, color: "#c9ddff", constellation: "crux" },
  { id: "mimosa", name: "Mimosa (十字架三)", raHours: 12.7953, decDegrees: -59.6888, magnitude: 1.25, color: "#c9ddff", constellation: "crux" },
  { id: "gacrux", name: "Gacrux (十字架一)", raHours: 12.5194, decDegrees: -57.1119, magnitude: 1.59, color: "#ffb588", constellation: "crux" },
  { id: "imai", name: "Imai (十字架四)", raHours: 12.2514, decDegrees: -58.7489, magnitude: 2.78, color: "#c9ddff", constellation: "crux" },
  { id: "rigil-kentaurus", name: "Rigil Kentaurus (南门二)", raHours: 14.6608, decDegrees: -60.8356, magnitude: -0.27, color: "#ffe8bc", constellation: "centaurus" },
  { id: "hadar", name: "Hadar (马腹一)", raHours: 14.0637, decDegrees: -60.373, magnitude: 0.61, color: "#c9ddff", constellation: "centaurus" },

  // Other Navigation Beacons
  { id: "capella", name: "Capella (五车二)", raHours: 5.2782, decDegrees: 45.998, magnitude: 0.08, color: "#fff5cf", constellation: "auriga" },
  { id: "arcturus", name: "Arcturus (大角星)", raHours: 14.261, decDegrees: 19.182, magnitude: -0.05, color: "#ffd7a6", constellation: "bootes" },
  { id: "spica", name: "Spica (角宿一)", raHours: 13.4199, decDegrees: -11.1614, magnitude: 0.98, color: "#c6dcff", constellation: "virgo" },
  { id: "fomalhaut", name: "Fomalhaut (北落师门)", raHours: 22.9608, decDegrees: -29.622, magnitude: 1.16, color: "#d6e7ff", constellation: "piscis-austrinus" },
  { id: "canopus", name: "Canopus (老人星)", raHours: 6.3992, decDegrees: -52.6957, magnitude: -0.74, color: "#fff5d8", constellation: "carina" },
  { id: "achernar", name: "Achernar (水委一)", raHours: 1.6286, decDegrees: -57.2367, magnitude: 0.46, color: "#d7e6ff", constellation: "eridanus" },
];

export function createFaintStarField(count: number): StarRecord[] {
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  return Array.from({ length: count }, (_, index) => ({
    id: `faint-${index}`,
    name: "",
    raHours: random() * 24,
    decDegrees: Math.asin(random() * 2 - 1) * (180 / Math.PI),
    magnitude: 3.2 + random() * 2.8,
    color: random() > 0.76 ? "#cddfff" : "#f1eee5",
    constellation: "",
  }));
}
