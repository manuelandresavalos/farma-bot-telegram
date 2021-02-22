const { Telegraf, Markup } = require('telegraf'); // -> Importo Telegraf - https://www.npmjs.com/package/telegraf
const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
var timeZones = require('./timeZones.js');
timeZones.loadTimeZones();

const expressApp = express();
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://farma-bot-telegram.herokuapp.com';

// En el apartado de .env es donde se colocan las credenciales y variables de entorno.
// Instancio el Telegraf Bot con el token de mi bot, este lo consigo desde la app de Telegram con el robot BotFather -> /mybots
const bot = new Telegraf(BOT_TOKEN);
//bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
//expressApp.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

/*--------------------------------------------------------------------------------------------------
LOGICA DEL BOT AQUI
--------------------------------------------------------------------------------------------------*/
Date.prototype.addHours = function(h) {
	this.setTime(this.getTime() + h * 60 * 60 * 1000);

	return this;
};

Date.prototype.addDays = function(days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};

//bot.start se ejecuta cuando una persona lo utiliza por primera vez.
bot.start((ctx) => {
	ctx.reply('Bienvenido/a Farmacias de turno SDE! By Manuel Avalos');
	getAyuda(ctx);
});

//bot.help es un comando propio de telegram (/help) y viene por defecto.
//Cuando invocamos /help, ejecutamos la función que querramos, en este caso una respuesta solicitando un sticker.
bot.help((ctx) => ctx.reply('Send me a sticker'));

bot.on('sticker', (ctx) => ctx.reply('👍'));
/*--------------------------------------------------------------------------------------------------
LOGICA DEL BOT AQUI
--------------------------------------------------------------------------------------------------*/
//---------------------------------------------------------------------------------------------------
//                                              HEARS
//---------------------------------------------------------------------------------------------------
bot.hears('Ayuda', (ctx) => {
	getAyuda(ctx);
});

bot.hears('Farmacias de Turno', (ctx) => {
	getFarmaciaDeTurno(ctx);
});

bot.hears('Listado de Farmacias', (ctx) => {
	getFarmacias(ctx);
});

bot.hears('hi', (ctx) => ctx.reply('Hi there!'));

//---------------------------------------------------------------------------------------------------
//                                              ACTIONS
//---------------------------------------------------------------------------------------------------
/*
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
});*/

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
				{ text: 'Farmacias de Turno' }
			],
			[
				{ text: 'Listado de Farmacias' }
			]
		];

		let message = 'Puedes realizar las siguientes acciones\n';
		message += 'Escribir <b>"Ayuda"</b>, abrirá un teclado especial con las acciones que puedes hacer. \n';
		message += 'Escribir <b>"Farmacias de Turno"</b>, te mostrará que farmacia está de turno el día de hoy. \n';
		message += 'Escribir <b>"Listado de Farmacias"</b>, te mostrará el listado de todas las farmacias con sus datos.\n';
		ctx.telegram.sendMessage(ctx.chat.id, message, {
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
	farmaciasArr.forEach((farmaNode) => {
		message += '<b>Farmacia:</b> ' + farmaNode.FARMACIA + '\n';
		message += '<b>Dirección:</b> ' + farmaNode.DIRECCION + '\n';
		message += '<b>eléfono:</b> ' + (farmaNode['T.E.'] != undefined ? farmaNode['T.E.'] : 'Sin Teléfono');
		message += '\n\n';
	});
	message +=
		'<b>Recuerda que</b> las farmacias están de turno desde las 22:00hs de un día hasta las 22:00hs del otro día.\n';

	console.log(timeZones.getTimeZoneGMT('America/Cambridge_Bay'));
	//ctx.telegram.sendMessage(ctx.chat.id, message, { parse_mode: 'HTML' });
}

function getFarmaciaDeTurno(ctx) {
	const now = getGTMActualTime('GTM-3');
	const tomorrow = now.addDays(1);
	const todayDateFormat = now.toISOString().split('T')[0].split('-').reverse().join('/');
	const tomorrowDateFormat = tomorrow.toISOString().split('T')[0].split('-').reverse().join('/');
	const nowTimeFormat = now.toISOString().split('T')[1].split(':').slice(0, 2).join(':');

	let farmaNode = farmaciasJSON.farmacias.find((nodo) => nodo.DATE == todayDateFormat);
	let message = '<b>DE TURNO HOY</b> - ' + todayDateFormat + '\n';
	message += '<b>Farmacia:</b> ' + farmaNode.FARMACIA + '\n';
	message += '<b>Dirección:</b> ' + farmaNode.DIRECCION + '\n';
	message += '<b>eléfono:</b> ' + (farmaNode['T.E.'] != undefined ? farmaNode['T.E.'] : 'Sin Teléfono');
	message += '\n\n';

	let farmaNode2 = farmaciasJSON.farmacias.find((nodo) => nodo.DATE == tomorrowDateFormat);
	message += '<b>DE TURNO MAÑANA</b> - ' + tomorrowDateFormat + '\n';
	message += '<b>Farmacia:</b> ' + farmaNode2.FARMACIA + '\n';
	message += '<b>Dirección:</b> ' + farmaNode2.DIRECCION + '\n';
	message += '<b>eléfono:</b> ' + (farmaNode2['T.E.'] != undefined ? farmaNode2['T.E.'] : 'Sin Teléfono');
	message += '\n\n';
	message +=
		'<b>Recuerda</b> que las farmacias están de turno desde las 22:00hs de un día hasta las 22:00hs del otro día.\n';
	message += 'Fecha actual: ' + todayDateFormat + '\n';
	message += 'Hora actual: ' + nowTimeFormat;

	ctx.telegram.sendMessage(ctx.chat.id, message, { parse_mode: 'HTML' });
}

// Filtra los objetos repetidos de un array de objetos dependiendo la propiedad por la que se quiera filtrar
function filterArrayOfObjectByProperty(array, prop) {
	let hash = {};
	let farmaArray = array.filter(function(current) {
		var exists = !hash[current[prop]];
		hash[current[prop]] = true;
		return exists;
	});

	return farmaArray;
}

function getToday() {
	let date = new Date();
	//let day = date.getDate() > 9 ? date.getDate() : '0' + date.getDate();
	//let month = date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
	//let year = date.getFullYear();
	//return day + '/' + month + '/' + year;
	return date;
}

function getGTMActualTime(gtmString) {
	let time = new Date();
	time.addHours(extractGTMTimeFromString(gtmString));

	//let hours = time.getHours() > 9 ? time.getHours() : '0' + time.getHours();
	//let minutes = time.getMinutes() > 9 ? time.getMinutes() : '0' + time.getMinutes();
	//return hours + ':' + minutes;
	return time;
}

function extractGTMTimeFromString(gtmString) {
	let tempString = gtmString.toLowerCase();

	return Number(tempString.replace('gtm', ''));
}
//---------------------------------------------------------------------------------------------------
//                                              JSON DATA
//---------------------------------------------------------------------------------------------------
var contents = fs.readFileSync('farmacias.json');
var farmaciasJSON = JSON.parse(contents);

//---------------------------------------------------------------------------------------------------
//                                             INICIALIZAR BOT
//---------------------------------------------------------------------------------------------------
//Inicializar Bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

//---------------------------------------------------------------------------------------------------
//                                              URLS PARA WEB
//---------------------------------------------------------------------------------------------------
expressApp.get('/', (req, res) => {
	res.send('Hello World!');
});
expressApp.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

getFarmacias();
