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

/*--------------------------------------------------------------------------------------------------
LOGICA DEL BOT AQUI
--------------------------------------------------------------------------------------------------*/
//---------------------------------------------------------------------------------------------------
//                                              HEARS
//---------------------------------------------------------------------------------------------------
bot.hears('Ayuda', (ctx) => getAyuda(ctx));

bot.hears('Farmacias de turno', (ctx) => getFarmaciaDeTurno(ctx));

bot.hears('Listado de Farmacias', (ctx) => getFarmacias(ctx));

//---------------------------------------------------------------------------------------------------
//                                              ACTIONS
//---------------------------------------------------------------------------------------------------
bot.action('ayuda', (ctx) => {
	ctx.deleteMessage();
	getAyuda(ctx);
});

bot.action('farmacias', (ctx) => {
	ctx.deleteMessage();
	getFarmacias(ctx);
});

bot.action('farmacia_de_turno', (ctx) => {
	ctx.deleteMessage();
	getFarmaciaDeTurno(ctx);
});

//---------------------------------------------------------------------------------------------------
//                                              METHODS
//---------------------------------------------------------------------------------------------------
function getAyuda(ctx) {
	bot.telegram.getMyCommands().then((listOfCommands) => {
		let actions = [
			[
				{ text: 'Ayuda' }
			],
			[
				{ text: 'Farmacias de turno' }
			],
			[
				{ text: 'Listado de Farmacias', callback_data: 'farmacias' }
			]
		];

		ctx.telegram.sendMessage(ctx.chat.id, 'Puedes realizar las siguientes acciones:', {
			reply_markup: {
				keyboard: actions
			},
			parse_mode: 'HTML'
		});
	});
}

function getFarmacias(ctx) {
	let message = '';
	let farmaciasArr = filterArrayOfObjectByProperty(farmaciasJSON.farmacias, 'FARMACIA');
	farmaciasArr.forEach((farma) => {
		message += 'Farmacia: ' + farma.FARMACIA + '\n';
		message += 'Dirección: ' + farma.DIRECCION + '\n';
		message += 'Teléfono: ' + farma['T.E.'];
		message += '\n\n';
	});

	ctx.reply(message);
}

function getFarmaciaDeTurno(ctx) {
	const today = getToday();
	const farmaNode = farmaciasJSON.farmacias.find((nodo) => nodo.DATE == today);
	let message = 'De turno hoy - ' + today + '\n\n';
	message += 'Farmacia: ' + farmaNode.FARMACIA + '\n';
	message += 'Dirección: ' + farmaNode.DIRECCION + '\n';
	message += 'Teléfono: ' + farmaNode['T.E.'];

	ctx.reply(message);
}

//---------------------------------------------------------------------------------------------------
//                                              URLS PARA WEB
//---------------------------------------------------------------------------------------------------
expressApp.get('/', (req, res) => {
	res.send('Hello World!');
});
expressApp.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
