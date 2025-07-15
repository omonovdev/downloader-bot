const { Telegraf, Markup } = require("telegraf");
const ytdlp = require("yt-dlp-exec");
const { Readable } = require("stream");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// URLlarni saqlash uchun Map
const links = new Map();

bot.start((ctx) => {
  ctx.reply("👋 Salom! Yuklamoqchi bo‘lgan video linkini yuboring.");
});

// URL validatsiyasi
const validUrl = (url) =>
  /^https?:\/\/(www\.)?(instagram\.com|youtube\.com|youtu\.be|tiktok\.com)/.test(url);

// Foydalanuvchi link yuborganda
bot.on("text", async (ctx) => {
  const url = ctx.message.text.trim();

  if (!validUrl(url)) {
    return ctx.reply("❌ Faqat Instagram, YouTube yoki TikTok link yuboring.");
  }

  const id = Date.now().toString(); // Unikal ID
  links.set(id, url);

  ctx.reply(
    "✅ Havola qabul qilindi. Yuklash turini tanlang:",
    Markup.inlineKeyboard([
      [Markup.button.callback("🎥 Video", `video:${id}`)],
      [Markup.button.callback("🎵 Audio", `audio:${id}`)],
    ])
  );
});

// Tugma bosilganda
bot.action(/(video|audio):(.+)/, async (ctx) => {
  const type = ctx.match[1];
  const id = ctx.match[2];
  const url = links.get(id);

  if (!url) return ctx.reply("❌ Ma'lumot topilmadi yoki muddati tugagan.");

  await ctx.answerCbQuery();

  // Yuklanmoqda xabari
  const loadingMsg = await ctx.reply(`⏳ Yuklanmoqda: ${type.toUpperCase()}`);

  try {
    const format = type === "audio" ? "bestaudio" : "mp4";

    const process = ytdlp.exec(url, {
      format,
      output: "-", // stdout orqali olish
    });

    const videoStream = Readable.from(process.stdout);
    const fileName = type === "audio" ? "audio.mp3" : "video.mp4";

    await ctx.replyWithDocument({ source: videoStream, filename: fileName });

    // Yuklab bo‘lgach "Yuklanmoqda..." xabarini o‘chirish
    await ctx.deleteMessage(loadingMsg.message_id);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Yuklab bo‘lmadi! Havola yoki formatni tekshiring.");
  }
});

bot.launch();
console.log("✅ Downloader Bot optimallashtirilgan holda ishga tushdi...");
