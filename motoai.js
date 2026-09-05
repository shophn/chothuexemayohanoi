/*
 * MotoAI 1.0.0
 * Single-file motorcycle rental assistant.
 *
 * Goals:
 * - Clean one-file architecture
 * - Model-first vehicle recognition
 * - Conversation context
 * - Website knowledge learning
 * - Lexical BM25 retrieval
 * - Price learning from website data
 * - Messenger-style UI
 * - No external dependencies
 *
 * Public API:
 *   MotoAI.open()
 *   MotoAI.close()
 *   MotoAI.send(text)
 *   MotoAI.learn()
 *   MotoAI.search(query)
 *   MotoAI.debug()
 *   MotoAI.clearCache()
 */

(function () {
  "use strict";

  if (window.MotoAI) return;

  /* =========================================================
     CONFIG
  ========================================================= */

  const CFG = Object.assign(
    {
      version: "1.0.0",

      brand: "ShopHN",
      phone: "0942467674",
      avatar: "👩‍💼",

      theme: "#0084FF",

      autoLearn: true,
      refreshHours: 24,

      maxPages: 120,
      maxContextTurns: 8,
      maxMessages: 30,

      fetchTimeout: 10000,

      sitemapFile: "/moto_sitemap.json",

      noMarkdownReply: true,
      noLinksInReply: true,

      debug: false
    },
    window.MotoAI_CONFIG || {}
  );

  /* =========================================================
     STORAGE
  ========================================================= */

  const STORE = {
    knowledge: "MotoAI_1_0_knowledge",
    prices: "MotoAI_1_0_prices",
    context: "MotoAI_1_0_context",
    session: "MotoAI_1_0_session",
    stats: "MotoAI_1_0_stats"
  };

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function clearStore() {
    Object.keys(STORE).forEach(function (key) {
      try {
        localStorage.removeItem(STORE[key]);
      } catch (e) {}
    });
  }

  /* =========================================================
     BASIC UTILITIES
  ========================================================= */

  function now() {
    return Date.now();
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(Boolean);
  }

  function money(value) {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  }

  function finish(text) {
    let output = String(text || "")
      .replace(/\s+/g, " ")
      .trim();

    if (CFG.noLinksInReply) {
      output = output
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/www\.\S+/gi, "");
    }

    if (CFG.noMarkdownReply) {
      output = output
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`~>#]+/g, "");
    }

    output = output.replace(/\s{2,}/g, " ").trim();

    if (output && !/[.!?]$/.test(output)) {
      output += ".";
    }

    return output;
  }

  /* =========================================================
     VEHICLE DATABASE
  ========================================================= */

  const VEHICLES = {
    vision: {
      brand: "Honda",
      family: "xe ga",
      aliases: [
        "vision",
        "honda vision",
        "xe vision",
        "con vision"
      ]
    },

    "air blade": {
      brand: "Honda",
      family: "xe ga",
      aliases: [
        "air blade",
        "airblade",
        "air blade honda",
        "honda ab",
        "xe ab",
        "con ab",
        "ab"
      ]
    },

    lead: {
      brand: "Honda",
      family: "xe ga",
      aliases: [
        "lead",
        "honda lead",
        "xe lead"
      ]
    },

    sh: {
      brand: "Honda",
      family: "xe ga",
      aliases: [
        "sh",
        "honda sh",
        "sh mode"
      ]
    },

    wave: {
      brand: "Honda",
      family: "xe so",
      aliases: [
        "wave",
        "honda wave",
        "wave alpha",
        "xe wave",
        "con wave"
      ]
    },

    blade: {
      brand: "Honda",
      family: "xe so",
      aliases: [
        "blade",
        "honda blade",
        "xe blade"
      ]
    },

    sirius: {
      brand: "Yamaha",
      family: "xe so",
      aliases: [
        "sirius",
        "yamaha sirius",
        "xe sirius"
      ]
    },

    jupiter: {
      brand: "Yamaha",
      family: "xe so",
      aliases: [
        "jupiter",
        "yamaha jupiter",
        "xe jupiter"
      ]
    },

    grande: {
      brand: "Yamaha",
      family: "xe ga",
      aliases: [
        "grande",
        "yamaha grande"
      ]
    },

    janus: {
      brand: "Yamaha",
      family: "xe ga",
      aliases: [
        "janus",
        "yamaha janus"
      ]
    },

    exciter: {
      brand: "Yamaha",
      family: "xe con tay",
      aliases: [
        "exciter",
        "yamaha exciter"
      ]
    },

    winner: {
      brand: "Honda",
      family: "xe con tay",
      aliases: [
        "winner",
        "winner x",
        "honda winner"
      ]
    },

    vespa: {
      brand: "Piaggio",
      family: "xe ga",
      aliases: [
        "vespa",
        "piaggio vespa"
      ]
    },

    liberty: {
      brand: "Piaggio",
      family: "xe ga",
      aliases: [
        "liberty",
        "piaggio liberty"
      ]
    },

    "xe dien": {
      brand: "VinFast",
      family: "xe dien",
      aliases: [
        "xe dien",
        "xe điện",
        "vinfast",
        "klara",
        "yadea",
        "dibao"
      ]
    },

    "50cc": {
      brand: "",
      family: "50cc",
      aliases: [
        "50cc",
        "50 cc",
        "xe 50cc",
        "xe 50 cc"
      ]
    },

    "xe so": {
      brand: "",
      family: "xe so",
      aliases: [
        "xe so",
        "xe số",
        "xe may so"
      ]
    },

    "xe ga": {
      brand: "",
      family: "xe ga",
      aliases: [
        "xe ga",
        "xe tay ga",
        "scooter"
      ]
    },

    "xe con tay": {
      brand: "",
      family: "xe con tay",
      aliases: [
        "xe con tay",
        "xe côn tay",
        "tay con",
        "tay côn"
      ]
    }
  };

  /* =========================================================
     DEFAULT PRICE DATABASE
  ========================================================= */

  const DEFAULT_PRICES = {
    "xe so": {
      day: [150000],
      week: [600000, 700000],
      month: [850000, 1200000]
    },

    "xe ga": {
      day: [150000, 200000],
      week: [600000, 1000000],
      month: [1100000, 2000000]
    },

    "air blade": {
      day: [200000],
      week: [800000],
      month: [1600000, 1800000]
    },

    vision: {
      day: [200000],
      week: [700000, 850000],
      month: [1400000, 1900000]
    },

    wave: {
      day: [150000],
      week: [600000, 700000],
      month: [850000, 1200000]
    },

    blade: {
      day: [150000],
      week: [600000, 700000],
      month: [850000, 1200000]
    },

    sirius: {
      day: [150000],
      week: [600000, 700000],
      month: [850000, 1200000]
    },

    jupiter: {
      day: [150000],
      week: [600000, 700000],
      month: [850000, 1200000]
    },

    lead: {
      day: [200000],
      week: [800000],
      month: [1600000, 1900000]
    },

    grande: {
      day: [220000],
      week: [900000],
      month: [1700000, 2000000]
    },

    janus: {
      day: [200000],
      week: [800000],
      month: [1500000, 1900000]
    },

    liberty: {
      day: [220000],
      week: [900000],
      month: [1700000, 2000000]
    },

    vespa: {
      day: [300000],
      week: [1200000],
      month: [2400000, 2800000]
    },

    sh: {
      day: [450000],
      week: [1800000],
      month: [4500000]
    },

    "xe dien": {
      day: [170000],
      week: [800000],
      month: [1600000]
    },

    "50cc": {
      day: [200000],
      week: [800000],
      month: [1700000]
    },

    "xe con tay": {
      day: [300000],
      week: [1200000],
      month: null
    }
  };

  /* =========================================================
     MODEL RESOLUTION
  ========================================================= */

  function resolveVehicle(text) {
    const input = normalize(text);
    let best = null;

    Object.keys(VEHICLES).forEach(function (model) {
      const item = VEHICLES[model];

      item.aliases.forEach(function (alias) {
        const normalizedAlias = normalize(alias);

        if (
          input === normalizedAlias ||
          input.indexOf(" " + normalizedAlias + " ") >= 0 ||
          input.indexOf(normalizedAlias + " ") === 0 ||
          input.indexOf(" " + normalizedAlias) === input.length - normalizedAlias.length - 1
        ) {
          let confidence = 0.82;

          if (input === normalizedAlias) {
            confidence = 1;
          }

          if (normalizedAlias.length >= 5) {
            confidence += 0.05;
          }

          if (!best || confidence > best.confidence) {
            best = {
              entity: "vehicle_model",
              model: model,
              brand: item.brand,
              family: item.family,
              confidence: Math.min(confidence, 0.99)
            };
          }
        }
      });
    });

    return best;
  }

  /* =========================================================
     DURATION PARSER
  ========================================================= */

  function parseDuration(text) {
    const input = normalize(text);

    let unit = null;

    if (/\b(thang|month)\b/i.test(input)) {
      unit = "month";
    } else if (/\b(tuan|week)\b/i.test(input)) {
      unit = "week";
    } else if (/\b(ngay|day)\b/i.test(input)) {
      unit = "day";
    }

    if (!unit) return null;

    const match = input.match(/\b(\d{1,3})\b/);

    return {
      value: match ? Number(match[1]) : 1,
      unit: unit,
      confidence: match ? 0.98 : 0.6
    };
  }

  /* =========================================================
     INTENT
  ========================================================= */

  const INTENT_PATTERNS = {
    greeting: /^(chao|xin chao|hello|hi|hey|alo)\b/i,

    price:
      /(gia|bao nhieu|thue|tinh tien|price|cost|how much)/i,

    contact:
      /(lien he|zalo|goi|hotline|sdt|phone|contact)/i,

    documents:
      /(thu tuc|giay to|cccd|passport|ho chieu|document)/i,

    deposit:
      /(dat coc|coc|deposit)/i,

    delivery:
      /(giao xe|giao|tan noi|ship|delivery)/i,

    return:
      /(tra xe|gia han|doi xe|return|extend)/i,

    availability:
      /(con xe|xe trong|co xe|available|availability)/i
  };

  function detectIntent(text) {
    const keys = Object.keys(INTENT_PATTERNS);

    for (let i = 0; i < keys.length; i++) {
      if (INTENT_PATTERNS[keys[i]].test(text)) {
        return keys[i];
      }
    }

    return "general";
  }

  /* =========================================================
     CONTEXT
  ========================================================= */

  function getContext() {
    return readJSON(STORE.context, []);
  }

  function saveContext(userText, entities, answer) {
    const context = getContext();

    context.push({
      timestamp: now(),
      user: userText,
      model: entities.model || null,
      duration: entities.duration || null,
      intent: entities.intent || "general",
      answer: answer
    });

    writeJSON(
      STORE.context,
      context.slice(-CFG.maxContextTurns)
    );
  }

  function enrichFromContext(entities) {
    const context = getContext();

    for (let i = context.length - 1; i >= 0; i--) {
      const item = context[i];

      if (!entities.model && item.model) {
        entities.model = item.model;
      }

      if (!entities.duration && item.duration) {
        entities.duration = item.duration;
      }

      if (entities.model && entities.duration) {
        break;
      }
    }

    return entities;
  }

  /* =========================================================
     PRICE ENGINE
  ========================================================= */

  function getLearnedPrices() {
    return readJSON(STORE.prices, {});
  }

  function getPrice(model, unit) {
    const learned = getLearnedPrices();

    if (
      model &&
      learned[model] &&
      learned[model][unit]
    ) {
      return {
        values: Array.isArray(learned[model][unit])
          ? learned[model][unit]
          : [learned[model][unit]],
        source: "website"
      };
    }

    if (
      model &&
      DEFAULT_PRICES[model] &&
      DEFAULT_PRICES[model][unit]
    ) {
      return {
        values: DEFAULT_PRICES[model][unit],
        source: "model"
      };
    }

    if (
      model &&
      VEHICLES[model] &&
      DEFAULT_PRICES[VEHICLES[model].family] &&
      DEFAULT_PRICES[VEHICLES[model].family][unit]
    ) {
      return {
        values: DEFAULT_PRICES[VEHICLES[model].family][unit],
        source: "family"
      };
    }

    return null;
  }

  function unitName(unit) {
    if (unit === "week") return "tuần";
    if (unit === "month") return "tháng";
    return "ngày";
  }

  function buildPriceAnswer(vehicle, duration) {
    if (!vehicle) {
      return finish(
        "Anh chị muốn thuê mẫu xe nào để em báo giá"
      );
    }

    if (!duration) {
      return finish(
        "Anh chị muốn thuê " +
        vehicle.model +
        " theo ngày, tuần hay tháng"
      );
    }

    const price = getPrice(
      vehicle.model,
      duration.unit
    );

    if (!price) {
      return finish(
        "Em chưa có giá chắc chắn cho " +
        vehicle.model +
        " theo " +
        unitName(duration.unit) +
        ". Anh chị cho em biết thời gian thuê cụ thể để em kiểm tra"
      );
    }

    const values = price.values;

    const low = values[0];
    const high = values.length > 1
      ? values[values.length - 1]
      : values[0];

    const totalLow = low * duration.value;
    const totalHigh = high * duration.value;

    let total;

    if (totalLow === totalHigh) {
      total = money(totalLow);
    } else {
      total =
        money(totalLow) +
        "–" +
        money(totalHigh);
    }

    return finish(
      "Giá thuê " +
      vehicle.model +
      " " +
      duration.value +
      " " +
      unitName(duration.unit) +
      " khoảng " +
      total +
      ". Anh chị muốn em kiểm tra xe và lịch thuê không"
    );
  }

  /* =========================================================
     KNOWLEDGE ENGINE
  ========================================================= */

  function stripHTML(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function fetchText(url) {
    const controller = new AbortController();

    const timer = setTimeout(function () {
      controller.abort();
    }, CFG.fetchTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit"
      });

      if (!response.ok) {
        return null;
      }

      return await response.text();

    } catch (e) {
      return null;

    } finally {
      clearTimeout(timer);
    }
  }

  function parseSitemapXML(xml) {
    try {
      const doc =
        new DOMParser().parseFromString(
          xml,
          "text/xml"
        );

      return Array.from(
        doc.querySelectorAll(
          "url loc, sitemap loc"
        )
      )
        .map(function (node) {
          return node.textContent.trim();
        })
        .filter(Boolean);

    } catch (e) {
      return [];
    }
  }

  function parseJSONSitemap(text) {
    try {
      const data = JSON.parse(text);

      let urls = [];

      if (
        data.categories &&
        data.categories.pages &&
        Array.isArray(data.categories.pages.list)
      ) {
        urls = urls.concat(
          data.categories.pages.list
        );
      }

      if (
        data.categories &&
        data.categories.datasets &&
        Array.isArray(data.categories.datasets.list)
      ) {
        urls = urls.concat(
          data.categories.datasets.list
        );
      }

      return urls;

    } catch (e) {
      return [];
    }
  }

  function extractTitle(html, fallback) {
    const match = String(html || "").match(
      /<title[^>]*>([\s\S]*?)<\/title>/i
    );

    if (!match) return fallback || "";

    return stripHTML(match[1]).slice(0, 200);
  }

  function parsePage(url, body) {
    const isText =
      /\.txt(?:\?|$)/i.test(url) ||
      !/<html/i.test(body);

    if (isText) {
      return {
        url: url,
        title:
          url.split("/").pop() ||
          "knowledge",
        text: String(body)
          .replace(/\s+/g, " ")
          .trim()
      };
    }

    const main =
      body.match(/<main[\s\S]*?<\/main>/i)?.[0] ||
      body.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
      body;

    return {
      url: url,
      title: extractTitle(body, url),
      text: stripHTML(main).slice(0, 15000)
    };
  }

  /* =========================================================
     BM25 INDEX
  ========================================================= */

  function buildIndex(pages) {
    const documents = [];
    const documentFrequency = {};

    pages.forEach(function (page, index) {
      const combined =
        (page.title || "") +
        " " +
        (page.text || "");

      const words = tokenize(combined);
      const tf = {};

      words.forEach(function (word) {
        tf[word] = (tf[word] || 0) + 1;
      });

      Object.keys(tf).forEach(function (word) {
        documentFrequency[word] =
          (documentFrequency[word] || 0) + 1;
      });

      documents.push({
        id: index,
        url: page.url,
        title: page.title,
        text: page.text,
        tf: tf,
        length: words.length
      });
    });

    const averageLength =
      documents.reduce(
        function (sum, document) {
          return sum + document.length;
        },
        0
      ) / Math.max(1, documents.length);

    return {
      documents: documents,
      df: documentFrequency,
      avgLength: averageLength
    };
  }

  function getKnowledge() {
    return readJSON(
      STORE.knowledge,
      {
        version: "1.0.0",
        learnedAt: 0,
        pages: [],
        index: null
      }
    );
  }

  function searchKnowledge(query, limit) {
    const knowledge = getKnowledge();

    if (
      !knowledge.pages ||
      !knowledge.pages.length
    ) {
      return [];
    }

    const index =
      knowledge.index ||
      buildIndex(knowledge.pages);

    const queryTokens =
      Array.from(
        new Set(tokenize(query))
      );

    const N = index.documents.length;
    const k1 = 1.5;
    const b = 0.75;

    return index.documents
      .map(function (document) {
        let score = 0;

        queryTokens.forEach(function (token) {
          const frequency =
            document.tf[token] || 0;

          const df =
            index.df[token] || 0;

          if (!frequency || !df) {
            return;
          }

          const idf =
            Math.log(
              1 +
              (N - df + 0.5) /
              (df + 0.5)
            );

          score +=
            idf *
            (
              frequency * (k1 + 1)
            ) /
            (
              frequency +
              k1 *
              (
                1 -
                b +
                b *
                document.length /
                Math.max(
                  1,
                  index.avgLength
                )
              )
            );
        });

        const title =
          normalize(document.title);

        const normalizedQuery =
          normalize(query);

        if (
          normalizedQuery &&
          title.indexOf(normalizedQuery) >= 0
        ) {
          score += 3;
        }

        return {
          score: score,
          document: document
        };
      })
      .filter(function (item) {
        return item.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, limit || 4)
      .map(function (item) {
        return item.document;
      });
  }

  /* =========================================================
     EXTRACTIVE ANSWER
  ========================================================= */

  function bestSentences(text, query, count) {
    const queryTokens =
      new Set(tokenize(query));

    return String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map(function (sentence) {
        const words =
          new Set(tokenize(sentence));

        let hits = 0;

        queryTokens.forEach(function (token) {
          if (words.has(token)) {
            hits++;
          }
        });

        return {
          sentence: sentence.trim(),
          score:
            hits /
            Math.max(
              1,
              Math.sqrt(words.size)
            )
        };
      })
      .filter(function (item) {
        return (
          item.sentence &&
          item.score > 0
        );
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, count || 2)
      .map(function (item) {
        return item.sentence;
      });
  }

  /* =========================================================
     PRICE LEARNING
  ========================================================= */

  function extractPrices(text) {
    const results = [];

    const lines =
      String(text || "")
        .split(/[\n.!?]+/)
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean);

    lines.forEach(function (line) {
      const vehicle =
        resolveVehicle(line);

      if (!vehicle) {
        return;
      }

      let unit = null;

      if (/(thang|month)/i.test(line)) {
        unit = "month";
      } else if (/(tuan|week)/i.test(line)) {
        unit = "week";
      } else if (/(ngay|day)/i.test(line)) {
        unit = "day";
      }

      if (!unit) {
        return;
      }

      const matches =
        line.match(
          /\d{1,3}(?:[.,]\d{3})+|\d{3,7}\s*(?:k|đ|vnd|vnđ)?/gi
        );

      if (!matches) {
        return;
      }

      matches.forEach(function (raw) {
        let value = Number(
          String(raw)
            .replace(/[^0-9]/g, "")
        );

        if (
          /k/i.test(raw) &&
          value < 10000
        ) {
          value *= 1000;
        }

        if (
          value >= 50000 &&
          value <= 10000000
        ) {
          results.push({
            model: vehicle.model,
            unit: unit,
            value: value
          });
        }
      });
    });

    return results;
  }

  function saveLearnedPrices(items) {
    const prices =
      getLearnedPrices();

    items.forEach(function (item) {
      if (!prices[item.model]) {
        prices[item.model] = {};
      }

      if (!prices[item.model][item.unit]) {
        prices[item.model][item.unit] = [];
      }

      const existing =
        Array.isArray(
          prices[item.model][item.unit]
        )
          ? prices[item.model][item.unit]
          : [prices[item.model][item.unit]];

      if (
        existing.indexOf(item.value) < 0
      ) {
        existing.push(item.value);
      }

      prices[item.model][item.unit] =
        existing.slice(0, 4);
    });

    writeJSON(
      STORE.prices,
      prices
    );
  }

  /* =========================================================
     LEARNING
  ========================================================= */

  async function learn(sites) {
    const started = now();

    let roots =
      Array.isArray(sites)
        ? sites.slice()
        : sites
        ? [sites]
        : [location.origin];

    const pages = [];
    const seen = new Set();
    const learnedPrices = [];

    async function addPage(url) {
      if (
        !url ||
        seen.has(url) ||
        pages.length >= CFG.maxPages
      ) {
        return;
      }

      seen.add(url);

      const body =
        await fetchText(url);

      if (!body) {
        return;
      }

      const page =
        parsePage(url, body);

      if (
        !page.text ||
        page.text.length < 20
      ) {
        return;
      }

      pages.push(page);

      const prices =
        extractPrices(page.text);

      prices.forEach(function (item) {
        learnedPrices.push(item);
      });
    }

    for (
      let rootIndex = 0;
      rootIndex < roots.length;
      rootIndex++
    ) {
      let origin;

      try {
        origin =
          new URL(
            roots[rootIndex],
            location.href
          ).origin;
      } catch (e) {
        origin = location.origin;
      }

      const candidates = [
        origin + CFG.sitemapFile,
        origin + "/moto_sitemap.json",
        origin + "/sitemap.xml",
        origin + "/sitemap_index.xml"
      ];

      let urls = [];

      for (
        let i = 0;
        i < candidates.length;
        i++
      ) {
        const sitemapBody =
          await fetchText(
            candidates[i]
          );

        if (!sitemapBody) {
          continue;
        }

        if (
          /moto_sitemap\.json/i.test(
            candidates[i]
          )
        ) {
          urls =
            parseJSONSitemap(
              sitemapBody
            );
        } else if (
          /<sitemapindex|<urlset/i.test(
            sitemapBody
          )
        ) {
          urls =
            parseSitemapXML(
              sitemapBody
            );
        }

        if (urls.length) {
          break;
        }
      }

      if (!urls.length) {
        urls = [
          origin + "/"
        ];
      }

      urls =
        Array.from(
          new Set(urls)
        ).slice(
          0,
          CFG.maxPages
        );

      for (
        let i = 0;
        i < urls.length;
        i++
      ) {
        await addPage(
          urls[i]
        );
      }

      if (
        pages.length >= CFG.maxPages
      ) {
        break;
      }
    }

    saveLearnedPrices(
      learnedPrices
    );

    const index =
      buildIndex(pages);

    const knowledge = {
      version: CFG.version,
      learnedAt: now(),
      pages: pages,
      index: index
    };

    writeJSON(
      STORE.knowledge,
      knowledge
    );

    const stats = {
      learnedAt: now(),
      pages: pages.length,
      prices: learnedPrices.length,
      durationMs: now() - started
    };

    writeJSON(
      STORE.stats,
      stats
    );

    if (CFG.debug) {
      console.table([
        stats
      ]);
    }

    return stats;
  }

  /* =========================================================
     GENERAL ANSWERS
  ========================================================= */

  function generalAnswer(question) {
    const results =
      searchKnowledge(
        question,
        3
      );

    if (results.length) {
      const sentences =
        bestSentences(
          results[0].text,
          question,
          2
        );

      if (sentences.length) {
        return finish(
          sentences.join(" ")
        );
      }
    }

    if (
      INTENT_PATTERNS.greeting.test(
        question
      )
    ) {
      return finish(
        "Xin chào, em là trợ lý của " +
        CFG.brand +
        ". Anh chị muốn thuê xe ga, xe số, xe điện hay xe côn tay"
      );
    }

    if (
      INTENT_PATTERNS.documents.test(
        question
      )
    ) {
      return finish(
        "Thủ tục thuê xe thường gồm giấy tờ tùy thân và đặt cọc tùy mẫu xe. Anh chị cho em biết mẫu xe để em kiểm tra cụ thể"
      );
    }

    if (
      INTENT_PATTERNS.deposit.test(
        question
      )
    ) {
      return finish(
        "Mức đặt cọc phụ thuộc mẫu xe và thời gian thuê. Anh chị cho em biết mẫu xe muốn thuê"
      );
    }

    if (
      INTENT_PATTERNS.delivery.test(
        question
      )
    ) {
      return finish(
        "Cửa hàng có thể hỗ trợ giao xe tùy khu vực và lịch. Anh chị cho em biết địa điểm nhận xe"
      );
    }

    if (
      INTENT_PATTERNS.contact.test(
        question
      )
    ) {
      return finish(
        "Anh chị có thể gọi " +
        CFG.phone +
        " để được hỗ trợ trực tiếp"
      );
    }

    if (
      INTENT_PATTERNS.return.test(
        question
      )
    ) {
      return finish(
        "Anh chị báo trước thời gian trả hoặc gia hạn để cửa hàng sắp xếp. Nếu cho em biết mẫu xe và thời gian thuê em có thể kiểm tra thêm"
      );
    }

    return finish(
      "Anh chị cho em biết mẫu xe và thời gian muốn thuê, ví dụ Vision 5 ngày, để em báo nhanh"
    );
  }

  /* =========================================================
     MAIN ANSWER ENGINE
  ========================================================= */

  async function answer(question) {
    const started =
      now();

    let entities = {
      intent:
        detectIntent(question),
      model:
        resolveVehicle(question),
      duration:
        parseDuration(question)
    };

    entities =
      enrichFromContext(
        entities
      );

    let response;

    if (
      entities.intent === "price"
    ) {
      response =
        buildPriceAnswer(
          entities.model,
          entities.duration
        );

    } else if (
      entities.intent === "availability"
    ) {
      response = finish(
        "Anh chị cho em biết mẫu xe và thời gian thuê, em sẽ kiểm tra thông tin xe hiện có"
      );

    } else {
      response =
        generalAnswer(
          question
        );
    }

    response =
      finish(response);

    saveContext(
      question,
      entities,
      response
    );

    const stats =
      readJSON(
        STORE.stats,
        {}
      );

    stats.queries =
      (stats.queries || 0) + 1;

    stats.lastResponseMs =
      now() - started;

    if (
      entities.model
    ) {
      stats.modelDetected =
        (stats.modelDetected || 0) + 1;
    }

    if (
      entities.intent === "price"
    ) {
      stats.priceQueries =
        (stats.priceQueries || 0) + 1;
    }

    writeJSON(
      STORE.stats,
      stats
    );

    return response;
  }

  /* =========================================================
     CHAT UI
  ========================================================= */

  function mountUI() {
    if (
      document.getElementById(
        "motoai10-root"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.textContent = `
      #motoai10-root{
        position:fixed;
        right:16px;
        bottom:calc(16px + env(safe-area-inset-bottom,0px));
        z-index:2147483647;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif
      }

      #motoai10-bubble{
        width:58px;
        height:58px;
        border:0;
        border-radius:50%;
        background:${CFG.theme};
        color:#fff;
        font-size:24px;
        cursor:pointer;
        box-shadow:0 8px 30px rgba(0,0,0,.22)
      }

      #motoai10-card{
        position:fixed;
        right:16px;
        bottom:16px;
        width:min(420px,calc(100% - 24px));
        height:min(700px,72vh);
        background:#fff;
        border-radius:20px;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        box-shadow:0 16px 50px rgba(0,0,0,.28);
        transform:translateY(120%);
        transition:transform .22s ease
      }

      #motoai10-card.open{
        transform:translateY(0)
      }

      #motoai10-head{
        display:flex;
        align-items:center;
        gap:10px;
        padding:12px 14px;
        background:${CFG.theme};
        color:#fff
      }

      #motoai10-avatar{
        width:36px;
        height:36px;
        border-radius:50%;
        display:grid;
        place-items:center;
        background:rgba(255,255,255,.2)
      }

      #motoai10-name{
        font-weight:700;
        font-size:14px
      }

      #motoai10-status{
        font-size:11px;
        opacity:.9
      }

      #motoai10-close{
        margin-left:auto;
        border:0;
        background:none;
        color:#fff;
        font-size:23px;
        cursor:pointer
      }

      #motoai10-body{
        flex:1;
        overflow:auto;
        padding:12px;
        background:#edf1f5
      }

      .motoai10-message{
        max-width:82%;
        margin:7px 0;
        padding:9px 12px;
        border-radius:18px;
        font-size:14px;
        line-height:1.45;
        word-break:break-word
      }

      .motoai10-message.bot{
        background:#fff;
        color:#111
      }

      .motoai10-message.user{
        margin-left:auto;
        background:${CFG.theme};
        color:#fff;
        border-bottom-right-radius:5px
      }

      #motoai10-tags{
        display:flex;
        gap:7px;
        overflow-x:auto;
        padding:8px;
        border-top:1px solid #ddd;
        background:#fff
      }

      #motoai10-tags button{
        white-space:nowrap;
        border:1px solid #ddd;
        background:#fff;
        border-radius:999px;
        padding:6px 10px;
        font-size:12px;
        cursor:pointer
      }

      #motoai10-input{
        display:flex;
        gap:7px;
        padding:8px;
        border-top:1px solid #ddd;
        background:#fff
      }

      #motoai10-input input{
        flex:1;
        height:38px;
        border:1px solid #ddd;
        border-radius:20px;
        padding:0 13px;
        font-size:15px;
        outline:none
      }

      #motoai10-send{
        width:38px;
        height:38px;
        border:0;
        border-radius:50%;
        background:${CFG.theme};
        color:#fff;
        cursor:pointer
      }

      @media(max-width:520px){
        #motoai10-card{
          left:8px;
          right:8px;
          bottom:8px;
          width:auto;
          height:72vh
        }

        #motoai10-root{
          right:12px
        }
      }
    `;

    document.head.appendChild(
      style
    );

    const root =
      document.createElement(
        "div"
      );

    root.id =
      "motoai10-root";

    root.innerHTML = `
      <button
        id="motoai10-bubble"
        aria-label="Mở chat">
        💬
      </button>

      <section
        id="motoai10-card"
        aria-hidden="true">

        <header id="motoai10-head">

          <div id="motoai10-avatar">
            ${CFG.avatar}
          </div>

          <div>
            <div id="motoai10-name">
              ${CFG.brand}
            </div>

            <div id="motoai10-status">
              ● Đang hoạt động
            </div>
          </div>

          <button
            id="motoai10-close"
            aria-label="Đóng">
            ×
          </button>

        </header>

        <main id="motoai10-body"></main>

        <div id="motoai10-tags">

          <button data-question="Giá thuê xe máy">
            💰 Giá
          </button>

          <button data-question="Thuê xe ga">
            🛵 Xe ga
          </button>

          <button data-question="Thuê xe số">
            🏍 Xe số
          </button>

          <button data-question="Thuê theo tháng">
            📆 Theo tháng
          </button>

          <button data-question="Giao xe tận nơi">
            🚚 Giao xe
          </button>

          <button data-question="Thủ tục thuê xe">
            📄 Thủ tục
          </button>

        </div>

        <footer id="motoai10-input">

          <input
            id="motoai10-text"
            autocomplete="off"
            placeholder="Nhắn cho ${CFG.brand}...">

          <button
            id="motoai10-send"
            aria-label="Gửi">
            ➤
          </button>

        </footer>

      </section>
    `;

    document.body.appendChild(
      root
    );

    const bubble =
      root.querySelector(
        "#motoai10-bubble"
      );

    const card =
      root.querySelector(
        "#motoai10-card"
      );

    const close =
      root.querySelector(
        "#motoai10-close"
      );

    const body =
      root.querySelector(
        "#motoai10-body"
      );

    const input =
      root.querySelector(
        "#motoai10-text"
      );

    const sendButton =
      root.querySelector(
        "#motoai10-send"
      );

    function renderHistory() {
      body.innerHTML = "";

      const history =
        readJSON(
          STORE.session,
          []
        );

      if (!history.length) {
        addMessage(
          "bot",
          finish(
            "Xin chào, em là trợ lý của " +
            CFG.brand +
            ". Anh chị muốn thuê mẫu xe nào và trong bao lâu"
          )
        );
      }

      history.forEach(
        function (message) {
          addMessage(
            message.role,
            message.text
          );
        }
      );

      body.scrollTop =
        body.scrollHeight;
    }

    function addMessage(
      role,
      text
    ) {
      const element =
        document.createElement(
          "div"
        );

      element.className =
        "motoai10-message " +
        (
          role === "user"
            ? "user"
            : "bot"
        );

      element.textContent =
        text;

      body.appendChild(
        element
      );

      body.scrollTop =
        body.scrollHeight;
    }

    function saveMessage(
      role,
      text
    ) {
      const history =
        readJSON(
          STORE.session,
          []
        );

      history.push({
        role: role,
        text: text,
        timestamp: now()
      });

      writeJSON(
        STORE.session,
        history.slice(
          -CFG.maxMessages
        )
      );
    }

    async function sendMessage(
      text
    ) {
      const question =
        String(text || "")
          .trim();

      if (!question) {
        return;
      }

      saveMessage(
        "user",
        question
      );

      addMessage(
        "user",
        question
      );

      const typing =
        document.createElement(
          "div"
        );

      typing.className =
        "motoai10-message bot";

      typing.textContent =
        "Đang xử lý…";

      body.appendChild(
        typing
      );

      body.scrollTop =
        body.scrollHeight;

      const response =
        await answer(
          question
        );

      typing.remove();

      saveMessage(
        "bot",
        response
      );

      addMessage(
        "bot",
        response
      );
    }

    function openChat() {
      card.classList.add(
        "open"
      );

      card.setAttribute(
        "aria-hidden",
        "false"
      );

      bubble.style.display =
        "none";

      renderHistory();

      setTimeout(
        function () {
          input.focus();
        },
        100
      );
    }

    function closeChat() {
      card.classList.remove(
        "open"
      );

      card.setAttribute(
        "aria-hidden",
        "true"
      );

      bubble.style.display =
        "block";
    }

    bubble.onclick =
      openChat;

    close.onclick =
      closeChat;

    sendButton.onclick =
      function () {
        const value =
          input.value;

        input.value = "";

        sendMessage(
          value
        );
      };

    input.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();

          const value =
            input.value;

          input.value = "";

          sendMessage(
            value
          );
        }
      }
    );

    root
      .querySelectorAll(
        "#motoai10-tags button"
      )
      .forEach(
        function (button) {
          button.onclick =
            function () {
              sendMessage(
                button.dataset.question
              );
            };
        }
      );
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  const API = {

    version:
      CFG.version,

    open:
      function () {
        document
          .getElementById(
            "motoai10-bubble"
          )
          ?.click();
      },

    close:
      function () {
        document
          .getElementById(
            "motoai10-close"
          )
          ?.click();
      },

    send:
      function (text) {
        return answer(
          text
        );
      },

    learn:
      function (sites) {
        return learn(
          sites
        );
      },

    learnNow:
      function (sites) {
        return learn(
          sites
        );
      },

    search:
      function (query) {
        return searchKnowledge(
          query,
          5
        );
      },

    getIndex:
      function () {
        return getKnowledge()
          .pages || [];
      },

    getPrices:
      function () {
        return getLearnedPrices();
      },

    getContext:
      function () {
        return getContext();
      },

    debug:
      function () {
        const knowledge =
          getKnowledge();

        return {
          version:
            CFG.version,

          pages:
            knowledge.pages
              ? knowledge.pages.length
              : 0,

          prices:
            getLearnedPrices(),

          contextTurns:
            getContext().length,

          stats:
            readJSON(
              STORE.stats,
              {}
            )
        };
      },

    clearCache:
      function () {
        clearStore();
      }
  };

  window.MotoAI =
    API;

  window.MotoAI_1_0 =
    API;

  /* =========================================================
     BOOT
  ========================================================= */

  function boot() {
    mountUI();

    if (!CFG.autoLearn) {
      return;
    }

    const knowledge =
      getKnowledge();

    const isFresh =
      knowledge.learnedAt &&
      (
        now() -
        knowledge.learnedAt
      ) <
      CFG.refreshHours *
      60 *
      60 *
      1000;

    if (!isFresh) {
      learn(
        [location.origin]
      ).catch(
        function () {}
      );
    }

    if (CFG.debug) {
      console.log(
        "MotoAI 1.0 loaded",
        API.debug()
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot
    );
  } else {
    boot();
  }

})();
