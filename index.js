const { Telegraf, Markup } = require('telegraf'); // -> Importo Telegraf - https://www.npmjs.com/package/telegraf
const express = require('express');
const dotenv = require('dotenv');

const expressApp = express();
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://farma-bot-telegram.herokuapp.com';

// En el apartado de .env es donde se colocan las credenciales y variables de entorno.
// Instancio el Telegraf Bot con el token de mi bot, este lo consigo desde la app de Telegram con el robot BotFather -> /mybots
const bot = new Telegraf(BOT_TOKEN);
bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
expressApp.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

/*--------------------------------------------------------------------------------------------------
LOGICA DEL BOT AQUI
--------------------------------------------------------------------------------------------------*/

//bot.start se ejecuta cuando una persona lo utiliza por primera vez.
bot.start((ctx) => {
	ctx.reply('Bienvenido/a FarmaBot! By Manuel Avalos');
});

//bot.help es un comando propio de telegram (/help) y viene por defecto.
//Cuando invocamos /help, ejecutamos la función que querramos, en este caso una respuesta solicitando un sticker.
bot.help((ctx) => ctx.reply('Send me a sticker'));

//bot.on se ejecuta cuando se recive un tipo de mensaje especifico, ejemplos:
// bot.on("chosen_inline_result")  -> Se ejecuta cuando elijen un inline result (le dieron cklik a un botoncito de los inline_keyboard)
// bot.on("sticker")               -> Se ejecuta cuando el usuario envia un sticker
// bot.on("video")               -> Se ejecuta cuando el usuario envia un video
// Mas info: https://telegraf.js.org/classes/telegraf.html#on
bot.on('sticker', (ctx) => ctx.reply('👍'));

//bot.hears escucha cada mensaje que llega y se fija si machea con la palabra que buscamos, si la coincidencia es exacta, ejecuta la function
//En este caso, si el texto es "hi" se ejecuta. - https://www.geeksforgeeks.org/node-js-bot-hears-method/
bot.hears('hi', (ctx) => ctx.reply('Hey there'));
/*--------------------------------------------------------------------------------------------------
LOGICA DEL BOT AQUI
--------------------------------------------------------------------------------------------------*/

expressApp.get('/', (req, res) => {
	res.send('Hello World!');
});
expressApp.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
