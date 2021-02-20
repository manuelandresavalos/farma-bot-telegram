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

	ctx.telegram.sendMessage(ctx.chat.id, message, { parse_mode: 'HTML' });
}

function getFarmaciaDeTurno(ctx) {
	const now = getGTMActualTime('GTM-3');
	const tomorrow = now.addDays(1);
	const todayDateFormat = now.toISOString().split('T')[0].split('-').reverse().join('/');
	const tomorrowDateFormat = tomorrow.toISOString().split('T')[0].split('-').reverse().join('/');
	const nowTimeFormat = now.toISOString().split('T')[1].split(':').slice(0, 2).join(':');

	let farmaNode = farmaciasJSON.farmacias.find((nodo) => nodo.DATE == todayDateFormat);
	let message = '<b>DE TURNO HOY</b> - ' + todayDateFormat + '\n\n';
	message += '<b>Farmacia:</b> ' + farmaNode.FARMACIA + '\n';
	message += '<b>Dirección:</b> ' + farmaNode.DIRECCION + '\n';
	message += '<b>eléfono:</b> ' + (farmaNode['T.E.'] != undefined ? farmaNode['T.E.'] : 'Sin Teléfono');
	message += '\n\n';

	let farmaNode2 = farmaciasJSON.farmacias.find((nodo) => nodo.DATE == tomorrowDateFormat);
	message += '<b>DE TURNO MAÑANA</b> - ' + tomorrowDateFormat + '\n\n';
	message += '<b>Farmacia:</b> ' + farmaNode2.FARMACIA + '\n';
	message += '<b>Dirección:</b> ' + farmaNode2.DIRECCION + '\n';
	message += '<b>eléfono:</b> ' + (farmaNode2['T.E.'] != undefined ? farmaNode2['T.E.'] : 'Sin Teléfono');
	message += '\n\n';
	message +=
		'<b>Recuerda que</b> las farmacias están de turno desde las 22:00hs de un día hasta las 22:00hs del otro día.\n';
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
var farmaciasJSON = {
	farmacias: [
		{
			DATE: '01/02/2021',
			FARMACIA: 'SAAD AÑATUYA',
			DIRECCION: '25 DE MAYO 297',
			'T.E.': '+543844421214',
			GRUPO: '7'
		},
		{
			DATE: '02/02/2021',
			FARMACIA: 'AZAR',
			DIRECCION: 'PUEYRREDON 137',
			'T.E.': '+543844421283',
			GRUPO: '8'
		},
		{
			DATE: '03/02/2021',
			FARMACIA: 'FOP',
			DIRECCION: '25 DE MAYO  (S) 73',
			'T.E.': '+543844423108',
			GRUPO: '9'
		},
		{
			DATE: '04/02/2021',
			FARMACIA: 'GALENICA',
			DIRECCION: 'BELGRANO Y FCO DE AGUIRRE',
			GRUPO: '10'
		},
		{
			DATE: '05/02/2021',
			FARMACIA: 'OMEGA',
			DIRECCION: 'PUEYRREDON 37',
			'T.E.': '+543844423583',
			GRUPO: '1'
		},
		{
			DATE: '06/02/2021',
			FARMACIA: 'NATIVIDAD',
			DIRECCION: 'AV. ESPAÑA Y FRANCISCO DE AGUIRRE',
			'T.E.': '+543844421424',
			GRUPO: '2'
		},
		{
			DATE: '07/02/2021',
			FARMACIA: '9 DE JULIO',
			DIRECCION: '9 DE JULIO 353',
			'T.E.': '+543844423457',
			GRUPO: '3'
		},
		{
			DATE: '08/02/2021',
			FARMACIA: 'AÑATUYA',
			DIRECCION: 'BELGRANO Y ALVEAR',
			'T.E.': '+543844421464',
			GRUPO: '4'
		},
		{
			DATE: '09/02/2021',
			FARMACIA: 'AUAT MARCELA',
			DIRECCION: '25 DE MAYO 80',
			'T.E.': '+543844421276',
			GRUPO: '5'
		},
		{
			DATE: '10/02/2021',
			FARMACIA: 'DEL ROSARIO',
			DIRECCION: 'AV. DUMAS ESQ. ALBERDI',
			'T.E.': '+543844423578',
			GRUPO: '6'
		},
		{
			DATE: '11/02/2021',
			FARMACIA: 'SAAD AÑATUYA',
			DIRECCION: '25 DE MAYO 297',
			'T.E.': '+543844421214',
			GRUPO: '7'
		},
		{
			DATE: '12/02/2021',
			FARMACIA: 'AZAR',
			DIRECCION: 'PUEYRREDON 137',
			'T.E.': '+543844421283',
			GRUPO: '8'
		},
		{
			DATE: '13/02/2021',
			FARMACIA: 'FOP',
			DIRECCION: '25 DE MAYO  (S) 73',
			'T.E.': '+543844423108',
			GRUPO: '9'
		},
		{
			DATE: '14/02/2021',
			FARMACIA: 'GALENICA',
			DIRECCION: 'BELGRANO Y FCO DE AGUIRRE',
			GRUPO: '10'
		},
		{
			DATE: '15/02/2021',
			FARMACIA: 'OMEGA',
			DIRECCION: 'PUEYRREDON 37',
			'T.E.': '+543844423583',
			GRUPO: '1'
		},
		{
			DATE: '16/02/2021',
			FARMACIA: 'NATIVIDAD',
			DIRECCION: 'AV. ESPAÑA Y FRANCISCO DE AGUIRRE',
			'T.E.': '+543844421424',
			GRUPO: '2'
		},
		{
			DATE: '17/02/2021',
			FARMACIA: '9 DE JULIO',
			DIRECCION: '9 DE JULIO 353',
			'T.E.': '+543844423457',
			GRUPO: '3'
		},
		{
			DATE: '18/02/2021',
			FARMACIA: 'AÑATUYA',
			DIRECCION: 'BELGRANO Y ALVEAR',
			'T.E.': '+543844421464',
			GRUPO: '4'
		},
		{
			DATE: '19/02/2021',
			FARMACIA: 'AUAT MARCELA',
			DIRECCION: '25 DE MAYO 80',
			'T.E.': '+543844421276',
			GRUPO: '5'
		},
		{
			DATE: '20/02/2021',
			FARMACIA: 'DEL ROSARIO',
			DIRECCION: 'AV. DUMAS ESQ. ALBERDI',
			'T.E.': '+543844423578',
			GRUPO: '6'
		},
		{
			DATE: '21/02/2021',
			FARMACIA: 'SAAD AÑATUYA',
			DIRECCION: '25 DE MAYO 297',
			'T.E.': '+543844421214',
			GRUPO: '7'
		},
		{
			DATE: '22/02/2021',
			FARMACIA: 'AZAR',
			DIRECCION: 'PUEYRREDON 137',
			'T.E.': '+543844421283',
			GRUPO: '8'
		},
		{
			DATE: '23/02/2021',
			FARMACIA: 'FOP',
			DIRECCION: '25 DE MAYO  (S) 73',
			'T.E.': '+543844423108',
			GRUPO: '9'
		},
		{
			DATE: '24/02/2021',
			FARMACIA: 'GALENICA',
			DIRECCION: 'BELGRANO Y FCO DE AGUIRRE',
			GRUPO: '10'
		},
		{
			DATE: '25/02/2021',
			FARMACIA: 'OMEGA',
			DIRECCION: 'PUEYRREDON 37',
			'T.E.': '+543844423583',
			GRUPO: '1'
		},
		{
			DATE: '26/02/2021',
			FARMACIA: 'NATIVIDAD',
			DIRECCION: 'AV. ESPAÑA Y FRANCISCO DE AGUIRRE',
			'T.E.': '+543844421424',
			GRUPO: '2'
		},
		{
			DATE: '27/02/2021',
			FARMACIA: '9 DE JULIO',
			DIRECCION: '9 DE JULIO 353',
			'T.E.': '+543844423457',
			GRUPO: '3'
		},
		{
			DATE: '28/02/2021',
			FARMACIA: 'AÑATUYA',
			DIRECCION: 'BELGRANO Y ALVEAR',
			'T.E.': '+543844421464',
			GRUPO: '4'
		}
	]
};

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

var timeZoneArr = new Array();
timeZoneArr['Etc/GMT+12'] = 'GMT-12';
timeZoneArr['Etc/GMT+11'] = 'GMT-11';
timeZoneArr['Pacific/Midway'] = 'GMT-11';
timeZoneArr['Pacific/Niue'] = 'GMT-11';
timeZoneArr['Pacific/Pago_Pago'] = 'GMT-11';
timeZoneArr['America/Adak'] = 'GMT-10';
timeZoneArr['Etc/GMT+10'] = 'GMT-10';
timeZoneArr['HST'] = 'GMT-10';
timeZoneArr['Pacific/Honolulu'] = 'GMT-10';
timeZoneArr['Pacific/Rarotonga'] = 'GMT-10';
timeZoneArr['Pacific/Tahiti'] = 'GMT-10';
timeZoneArr['Pacific/Marquesas'] = 'GMT-9';
timeZoneArr['America/Anchorage'] = 'GMT-9';
timeZoneArr['America/Juneau'] = 'GMT-9';
timeZoneArr['America/Metlakatla'] = 'GMT-9';
timeZoneArr['America/Nome'] = 'GMT-9';
timeZoneArr['America/Sitka'] = 'GMT-9';
timeZoneArr['America/Yakutat'] = 'GMT-9';
timeZoneArr['Etc/GMT+9'] = 'GMT-9';
timeZoneArr['Pacific/Gambier'] = 'GMT-9';
timeZoneArr['America/Dawson'] = 'GMT-8';
timeZoneArr['America/Los_Angeles'] = 'GMT-8';
timeZoneArr['America/Tijuana'] = 'GMT-8';
timeZoneArr['America/Vancouver'] = 'GMT-8';
timeZoneArr['America/Whitehorse'] = 'GMT-8';
timeZoneArr['Etc/GMT+8'] = 'GMT-8';
timeZoneArr['PST8PDT'] = 'GMT-8';
timeZoneArr['Pacific/Pitcairn'] = 'GMT-8';
timeZoneArr['America/Boise'] = 'GMT-7';
timeZoneArr['America/Cambridge_Bay'] = 'GMT-7';
timeZoneArr['America/Chihuahua'] = 'GMT-7';
timeZoneArr['America/Creston'] = 'GMT-7';
timeZoneArr['America/Dawson_Creek'] = 'GMT-7';
timeZoneArr['America/Denver'] = 'GMT-7';
timeZoneArr['America/Edmonton'] = 'GMT-7';
timeZoneArr['America/Fort_Nelson'] = 'GMT-7';
timeZoneArr['America/Hermosillo'] = 'GMT-7';
timeZoneArr['America/Inuvik'] = 'GMT-7';
timeZoneArr['America/Mazatlan'] = 'GMT-7';
timeZoneArr['America/Ojinaga'] = 'GMT-7';
timeZoneArr['America/Phoenix'] = 'GMT-7';
timeZoneArr['America/Yellowknife'] = 'GMT-7';
timeZoneArr['Etc/GMT+7'] = 'GMT-7';
timeZoneArr['MST'] = 'GMT-7';
timeZoneArr['MST7MDT'] = 'GMT-7';
timeZoneArr['America/Bahia_Banderas'] = 'GMT-6';
timeZoneArr['America/Belize'] = 'GMT-6';
timeZoneArr['America/Chicago'] = 'GMT-6';
timeZoneArr['America/Costa_Rica'] = 'GMT-6';
timeZoneArr['America/El_Salvador'] = 'GMT-6';
timeZoneArr['America/Guatemala'] = 'GMT-6';
timeZoneArr['America/Indiana/Knox'] = 'GMT-6';
timeZoneArr['America/Indiana/Tell_City'] = 'GMT-6';
timeZoneArr['America/Managua'] = 'GMT-6';
timeZoneArr['America/Matamoros'] = 'GMT-6';
timeZoneArr['America/Menominee'] = 'GMT-6';
timeZoneArr['America/Merida'] = 'GMT-6';
timeZoneArr['America/Mexico_City'] = 'GMT-6';
timeZoneArr['America/Monterrey'] = 'GMT-6';
timeZoneArr['America/North_Dakota/Beulah'] = 'GMT-6';
timeZoneArr['America/North_Dakota/Center'] = 'GMT-6';
timeZoneArr['America/North_Dakota/New_Salem'] = 'GMT-6';
timeZoneArr['America/Rainy_River'] = 'GMT-6';
timeZoneArr['America/Rankin_Inlet'] = 'GMT-6';
timeZoneArr['America/Regina'] = 'GMT-6';
timeZoneArr['America/Resolute'] = 'GMT-6';
timeZoneArr['America/Swift_Current'] = 'GMT-6';
timeZoneArr['America/Tegucigalpa'] = 'GMT-6';
timeZoneArr['America/Winnipeg'] = 'GMT-6';
timeZoneArr['CST6CDT'] = 'GMT-6';
timeZoneArr['Etc/GMT+6'] = 'GMT-6';
timeZoneArr['Pacific/Easter'] = 'GMT-6';
timeZoneArr['Pacific/Galapagos'] = 'GMT-6';
timeZoneArr['America/Atikokan'] = 'GMT-5';
timeZoneArr['America/Bogota'] = 'GMT-5';
timeZoneArr['America/Cancun'] = 'GMT-5';
timeZoneArr['America/Cayman'] = 'GMT-5';
timeZoneArr['America/Detroit'] = 'GMT-5';
timeZoneArr['America/Eirunepe'] = 'GMT-5';
timeZoneArr['America/Grand_Turk'] = 'GMT-5';
timeZoneArr['America/Guayaquil'] = 'GMT-5';
timeZoneArr['America/Havana'] = 'GMT-5';
timeZoneArr['America/Indiana/Indianapolis'] = 'GMT-5';
timeZoneArr['America/Indiana/Marengo'] = 'GMT-5';
timeZoneArr['America/Indiana/Petersburg'] = 'GMT-5';
timeZoneArr['America/Indiana/Vevay'] = 'GMT-5';
timeZoneArr['America/Indiana/Vincennes'] = 'GMT-5';
timeZoneArr['America/Indiana/Winamac'] = 'GMT-5';
timeZoneArr['America/Iqaluit'] = 'GMT-5';
timeZoneArr['America/Jamaica'] = 'GMT-5';
timeZoneArr['America/Kentucky/Louisville'] = 'GMT-5';
timeZoneArr['America/Kentucky/Monticello'] = 'GMT-5';
timeZoneArr['America/Lima'] = 'GMT-5';
timeZoneArr['America/Nassau'] = 'GMT-5';
timeZoneArr['America/New_York'] = 'GMT-5';
timeZoneArr['America/Nipigon'] = 'GMT-5';
timeZoneArr['America/Panama'] = 'GMT-5';
timeZoneArr['America/Pangnirtung'] = 'GMT-5';
timeZoneArr['America/Port-au-Prince'] = 'GMT-5';
timeZoneArr['America/Rio_Branco'] = 'GMT-5';
timeZoneArr['America/Thunder_Bay'] = 'GMT-5';
timeZoneArr['America/Toronto'] = 'GMT-5';
timeZoneArr['EST'] = 'GMT-5';
timeZoneArr['EST5EDT'] = 'GMT-5';
timeZoneArr['Etc/GMT+5'] = 'GMT-5';
timeZoneArr['America/Anguilla'] = 'GMT-4';
timeZoneArr['America/Antigua'] = 'GMT-4';
timeZoneArr['America/Aruba'] = 'GMT-4';
timeZoneArr['America/Asuncion'] = 'GMT-4';
timeZoneArr['America/Barbados'] = 'GMT-4';
timeZoneArr['America/Blanc-Sablon'] = 'GMT-4';
timeZoneArr['America/Boa_Vista'] = 'GMT-4';
timeZoneArr['America/Campo_Grande'] = 'GMT-4';
timeZoneArr['America/Caracas'] = 'GMT-4';
timeZoneArr['America/Cuiaba'] = 'GMT-4';
timeZoneArr['America/Curacao'] = 'GMT-4';
timeZoneArr['America/Dominica'] = 'GMT-4';
timeZoneArr['America/Glace_Bay'] = 'GMT-4';
timeZoneArr['America/Goose_Bay'] = 'GMT-4';
timeZoneArr['America/Grenada'] = 'GMT-4';
timeZoneArr['America/Guadeloupe'] = 'GMT-4';
timeZoneArr['America/Guyana'] = 'GMT-4';
timeZoneArr['America/Halifax'] = 'GMT-4';
timeZoneArr['America/Kralendijk'] = 'GMT-4';
timeZoneArr['America/La_Paz'] = 'GMT-4';
timeZoneArr['America/Lower_Princes'] = 'GMT-4';
timeZoneArr['America/Manaus'] = 'GMT-4';
timeZoneArr['America/Marigot'] = 'GMT-4';
timeZoneArr['America/Martinique'] = 'GMT-4';
timeZoneArr['America/Moncton'] = 'GMT-4';
timeZoneArr['America/Montserrat'] = 'GMT-4';
timeZoneArr['America/Port_of_Spain'] = 'GMT-4';
timeZoneArr['America/Porto_Velho'] = 'GMT-4';
timeZoneArr['America/Puerto_Rico'] = 'GMT-4';
timeZoneArr['America/Santiago'] = 'GMT-4';
timeZoneArr['America/Santo_Domingo'] = 'GMT-4';
timeZoneArr['America/St_Barthelemy'] = 'GMT-4';
timeZoneArr['America/St_Kitts'] = 'GMT-4';
timeZoneArr['America/St_Lucia'] = 'GMT-4';
timeZoneArr['America/St_Thomas'] = 'GMT-4';
timeZoneArr['America/St_Vincent'] = 'GMT-4';
timeZoneArr['America/Thule'] = 'GMT-4';
timeZoneArr['America/Tortola'] = 'GMT-4';
timeZoneArr['Atlantic/Bermuda'] = 'GMT-4';
timeZoneArr['Etc/GMT+4'] = 'GMT-4';
timeZoneArr['America/St_Johns'] = 'GMT-3';
timeZoneArr['America/Araguaina'] = 'GMT-3';
timeZoneArr['America/Argentina/Buenos_Aires'] = 'GMT-3';
timeZoneArr['America/Argentina/Catamarca'] = 'GMT-3';
timeZoneArr['America/Argentina/Cordoba'] = 'GMT-3';
timeZoneArr['America/Argentina/Jujuy'] = 'GMT-3';
timeZoneArr['America/Argentina/La_Rioja'] = 'GMT-3';
timeZoneArr['America/Argentina/Mendoza'] = 'GMT-3';
timeZoneArr['America/Argentina/Rio_Gallegos'] = 'GMT-3';
timeZoneArr['America/Argentina/Salta'] = 'GMT-3';
timeZoneArr['America/Argentina/San_Juan'] = 'GMT-3';
timeZoneArr['America/Argentina/San_Luis'] = 'GMT-3';
timeZoneArr['America/Argentina/Tucuman'] = 'GMT-3';
timeZoneArr['America/Argentina/Ushuaia'] = 'GMT-3';
timeZoneArr['America/Bahia'] = 'GMT-3';
timeZoneArr['America/Belem'] = 'GMT-3';
timeZoneArr['America/Cayenne'] = 'GMT-3';
timeZoneArr['America/Fortaleza'] = 'GMT-3';
timeZoneArr['America/Godthab'] = 'GMT-3';
timeZoneArr['America/Maceio'] = 'GMT-3';
timeZoneArr['America/Miquelon'] = 'GMT-3';
timeZoneArr['America/Montevideo'] = 'GMT-3';
timeZoneArr['America/Paramaribo'] = 'GMT-3';
timeZoneArr['America/Punta_Arenas'] = 'GMT-3';
timeZoneArr['America/Recife'] = 'GMT-3';
timeZoneArr['America/Santarem'] = 'GMT-3';
timeZoneArr['America/Sao_Paulo'] = 'GMT-3';
timeZoneArr['Antarctica/Palmer'] = 'GMT-3';
timeZoneArr['Antarctica/Rothera'] = 'GMT-3';
timeZoneArr['Atlantic/Stanley'] = 'GMT-3';
timeZoneArr['Etc/GMT+3'] = 'GMT-3';
timeZoneArr['America/Noronha'] = 'GMT-2';
timeZoneArr['Atlantic/South_Georgia'] = 'GMT-2';
timeZoneArr['Etc/GMT+2'] = 'GMT-2';
timeZoneArr['America/Scoresbysund'] = 'GMT-1';
timeZoneArr['Atlantic/Azores'] = 'GMT-1';
timeZoneArr['Atlantic/Cape_Verde'] = 'GMT-1';
timeZoneArr['Etc/GMT+1'] = 'GMT-1';
timeZoneArr['Africa/Abidjan'] = 'GMT+0';
timeZoneArr['Africa/Accra'] = 'GMT+0';
timeZoneArr['Africa/Bamako'] = 'GMT+0';
timeZoneArr['Africa/Banjul'] = 'GMT+0';
timeZoneArr['Africa/Bissau'] = 'GMT+0';
timeZoneArr['Africa/Casablanca'] = 'GMT+0';
timeZoneArr['Africa/Conakry'] = 'GMT+0';
timeZoneArr['Africa/Dakar'] = 'GMT+0';
timeZoneArr['Africa/El_Aaiun'] = 'GMT+0';
timeZoneArr['Africa/Freetown'] = 'GMT+0';
timeZoneArr['Africa/Lome'] = 'GMT+0';
timeZoneArr['Africa/Monrovia'] = 'GMT+0';
timeZoneArr['Africa/Nouakchott'] = 'GMT+0';
timeZoneArr['Africa/Ouagadougou'] = 'GMT+0';
timeZoneArr['America/Danmarkshavn'] = 'GMT+0';
timeZoneArr['Antarctica/Troll'] = 'GMT+0';
timeZoneArr['Atlantic/Canary'] = 'GMT+0';
timeZoneArr['Atlantic/Faroe'] = 'GMT+0';
timeZoneArr['Atlantic/Madeira'] = 'GMT+0';
timeZoneArr['Atlantic/Reykjavik'] = 'GMT+0';
timeZoneArr['Atlantic/St_Helena'] = 'GMT+0';
timeZoneArr['Etc/GMT'] = 'GMT+0';
timeZoneArr['Etc/UCT'] = 'GMT+0';
timeZoneArr['Etc/UTC'] = 'GMT+0';
timeZoneArr['Europe/Dublin'] = 'GMT+0';
timeZoneArr['Europe/Guernsey'] = 'GMT+0';
timeZoneArr['Europe/Isle_of_Man'] = 'GMT+0';
timeZoneArr['Europe/Jersey'] = 'GMT+0';
timeZoneArr['Europe/Lisbon'] = 'GMT+0';
timeZoneArr['Europe/London'] = 'GMT+0';
timeZoneArr['UTC'] = 'GMT+0';
timeZoneArr['WET'] = 'GMT+0';
timeZoneArr['Africa/Algiers'] = 'GMT+1';
timeZoneArr['Africa/Bangui'] = 'GMT+1';
timeZoneArr['Africa/Brazzaville'] = 'GMT+1';
timeZoneArr['Africa/Ceuta'] = 'GMT+1';
timeZoneArr['Africa/Douala'] = 'GMT+1';
timeZoneArr['Africa/Kinshasa'] = 'GMT+1';
timeZoneArr['Africa/Lagos'] = 'GMT+1';
timeZoneArr['Africa/Libreville'] = 'GMT+1';
timeZoneArr['Africa/Luanda'] = 'GMT+1';
timeZoneArr['Africa/Malabo'] = 'GMT+1';
timeZoneArr['Africa/Ndjamena'] = 'GMT+1';
timeZoneArr['Africa/Niamey'] = 'GMT+1';
timeZoneArr['Africa/Porto-Novo'] = 'GMT+1';
timeZoneArr['Africa/Sao_Tome'] = 'GMT+1';
timeZoneArr['Africa/Tunis'] = 'GMT+1';
timeZoneArr['Africa/Windhoek'] = 'GMT+2';
timeZoneArr['Arctic/Longyearbyen'] = 'GMT+1';
timeZoneArr['CET'] = 'GMT+1';
timeZoneArr['Etc/GMT-1'] = 'GMT+1';
timeZoneArr['Europe/Amsterdam'] = 'GMT+1';
timeZoneArr['Europe/Andorra'] = 'GMT+1';
timeZoneArr['Europe/Belgrade'] = 'GMT+1';
timeZoneArr['Europe/Berlin'] = 'GMT+1';
timeZoneArr['Europe/Bratislava'] = 'GMT+1';
timeZoneArr['Europe/Brussels'] = 'GMT+1';
timeZoneArr['Europe/Budapest'] = 'GMT+1';
timeZoneArr['Europe/Busingen'] = 'GMT+1';
timeZoneArr['Europe/Copenhagen'] = 'GMT+1';
timeZoneArr['Europe/Gibraltar'] = 'GMT+1';
timeZoneArr['Europe/Ljubljana'] = 'GMT+1';
timeZoneArr['Europe/Luxembourg'] = 'GMT+1';
timeZoneArr['Europe/Madrid'] = 'GMT+1';
timeZoneArr['Europe/Malta'] = 'GMT+1';
timeZoneArr['Europe/Monaco'] = 'GMT+1';
timeZoneArr['Europe/Oslo'] = 'GMT+1';
timeZoneArr['Europe/Paris'] = 'GMT+1';
timeZoneArr['Europe/Podgorica'] = 'GMT+1';
timeZoneArr['Europe/Prague'] = 'GMT+1';
timeZoneArr['Europe/Rome'] = 'GMT+1';
timeZoneArr['Europe/San_Marino'] = 'GMT+1';
timeZoneArr['Europe/Sarajevo'] = 'GMT+1';
timeZoneArr['Europe/Skopje'] = 'GMT+1';
timeZoneArr['Europe/Stockholm'] = 'GMT+1';
timeZoneArr['Europe/Tirane'] = 'GMT+1';
timeZoneArr['Europe/Vaduz'] = 'GMT+1';
timeZoneArr['Europe/Vatican'] = 'GMT+1';
timeZoneArr['Europe/Vienna'] = 'GMT+1';
timeZoneArr['Europe/Warsaw'] = 'GMT+1';
timeZoneArr['Europe/Zagreb'] = 'GMT+1';
timeZoneArr['Europe/Zurich'] = 'GMT+1';
timeZoneArr['MET'] = 'GMT+1';
timeZoneArr['Africa/Blantyre'] = 'GMT+2';
timeZoneArr['Africa/Bujumbura'] = 'GMT+2';
timeZoneArr['Africa/Cairo'] = 'GMT+2';
timeZoneArr['Africa/Gaborone'] = 'GMT+2';
timeZoneArr['Africa/Harare'] = 'GMT+2';
timeZoneArr['Africa/Johannesburg'] = 'GMT+2';
timeZoneArr['Africa/Khartoum'] = 'GMT+2';
timeZoneArr['Africa/Kigali'] = 'GMT+2';
timeZoneArr['Africa/Lubumbashi'] = 'GMT+2';
timeZoneArr['Africa/Lusaka'] = 'GMT+2';
timeZoneArr['Africa/Maputo'] = 'GMT+2';
timeZoneArr['Africa/Maseru'] = 'GMT+2';
timeZoneArr['Africa/Mbabane'] = 'GMT+2';
timeZoneArr['Africa/Tripoli'] = 'GMT+2';
timeZoneArr['Asia/Amman'] = 'GMT+2';
timeZoneArr['Asia/Beirut'] = 'GMT+2';
timeZoneArr['Asia/Damascus'] = 'GMT+2';
timeZoneArr['Asia/Famagusta'] = 'GMT+2';
timeZoneArr['Asia/Gaza'] = 'GMT+2';
timeZoneArr['Asia/Hebron'] = 'GMT+2';
timeZoneArr['Asia/Jerusalem'] = 'GMT+2';
timeZoneArr['Asia/Nicosia'] = 'GMT+2';
timeZoneArr['EET'] = 'GMT+2';
timeZoneArr['Etc/GMT-2'] = 'GMT+2';
timeZoneArr['Europe/Athens'] = 'GMT+2';
timeZoneArr['Europe/Bucharest'] = 'GMT+2';
timeZoneArr['Europe/Chisinau'] = 'GMT+2';
timeZoneArr['Europe/Helsinki'] = 'GMT+2';
timeZoneArr['Europe/Kaliningrad'] = 'GMT+2';
timeZoneArr['Europe/Kiev'] = 'GMT+2';
timeZoneArr['Europe/Mariehamn'] = 'GMT+2';
timeZoneArr['Europe/Nicosia'] = 'GMT+2';
timeZoneArr['Europe/Riga'] = 'GMT+2';
timeZoneArr['Europe/Sofia'] = 'GMT+2';
timeZoneArr['Europe/Tallinn'] = 'GMT+2';
timeZoneArr['Europe/Uzhgorod'] = 'GMT+2';
timeZoneArr['Europe/Vilnius'] = 'GMT+2';
timeZoneArr['Europe/Zaporozhye'] = 'GMT+2';
timeZoneArr['Africa/Addis_Ababa'] = 'GMT+3';
timeZoneArr['Africa/Asmara'] = 'GMT+3';
timeZoneArr['Africa/Dar_es_Salaam'] = 'GMT+3';
timeZoneArr['Africa/Djibouti'] = 'GMT+3';
timeZoneArr['Africa/Juba'] = 'GMT+3';
timeZoneArr['Africa/Kampala'] = 'GMT+3';
timeZoneArr['Africa/Mogadishu'] = 'GMT+3';
timeZoneArr['Africa/Nairobi'] = 'GMT+3';
timeZoneArr['Antarctica/Syowa'] = 'GMT+3';
timeZoneArr['Asia/Aden'] = 'GMT+3';
timeZoneArr['Asia/Baghdad'] = 'GMT+3';
timeZoneArr['Asia/Bahrain'] = 'GMT+3';
timeZoneArr['Asia/Istanbul'] = 'GMT+3';
timeZoneArr['Asia/Kuwait'] = 'GMT+3';
timeZoneArr['Asia/Qatar'] = 'GMT+3';
timeZoneArr['Asia/Riyadh'] = 'GMT+3';
timeZoneArr['Etc/GMT-3'] = 'GMT+3';
timeZoneArr['Europe/Istanbul'] = 'GMT+3';
timeZoneArr['Europe/Kirov'] = 'GMT+3';
timeZoneArr['Europe/Minsk'] = 'GMT+3';
timeZoneArr['Europe/Moscow'] = 'GMT+3';
timeZoneArr['Europe/Simferopol'] = 'GMT+3';
timeZoneArr['Indian/Antananarivo'] = 'GMT+3';
timeZoneArr['Indian/Comoro'] = 'GMT+3';
timeZoneArr['Indian/Mayotte'] = 'GMT+3';
timeZoneArr['Asia/Tehran'] = 'GMT+3';
timeZoneArr['Asia/Baku'] = 'GMT+4';
timeZoneArr['Asia/Dubai'] = 'GMT+4';
timeZoneArr['Asia/Muscat'] = 'GMT+4';
timeZoneArr['Asia/Tbilisi'] = 'GMT+4';
timeZoneArr['Asia/Yerevan'] = 'GMT+4';
timeZoneArr['Etc/GMT-4'] = 'GMT+4';
timeZoneArr['Europe/Astrakhan'] = 'GMT+4';
timeZoneArr['Europe/Samara'] = 'GMT+4';
timeZoneArr['Europe/Saratov'] = 'GMT+4';
timeZoneArr['Europe/Ulyanovsk'] = 'GMT+4';
timeZoneArr['Europe/Volgograd'] = 'GMT+4';
timeZoneArr['Indian/Mahe'] = 'GMT+4';
timeZoneArr['Indian/Mauritius'] = 'GMT+4';
timeZoneArr['Indian/Reunion'] = 'GMT+4';
timeZoneArr['Asia/Kabul'] = 'GMT+4';
timeZoneArr['Antarctica/Mawson'] = 'GMT+5';
timeZoneArr['Asia/Aqtau'] = 'GMT+5';
timeZoneArr['Asia/Aqtobe'] = 'GMT+5';
timeZoneArr['Asia/Ashgabat'] = 'GMT+5';
timeZoneArr['Asia/Atyrau'] = 'GMT+5';
timeZoneArr['Asia/Dushanbe'] = 'GMT+5';
timeZoneArr['Asia/Karachi'] = 'GMT+5';
timeZoneArr['Asia/Oral'] = 'GMT+5';
timeZoneArr['Asia/Samarkand'] = 'GMT+5';
timeZoneArr['Asia/Tashkent'] = 'GMT+5';
timeZoneArr['Asia/Yekaterinburg'] = 'GMT+5';
timeZoneArr['Etc/GMT-5'] = 'GMT+5';
timeZoneArr['Indian/Kerguelen'] = 'GMT+5';
timeZoneArr['Indian/Maldives'] = 'GMT+5';
timeZoneArr['Asia/Colombo'] = 'GMT+5';
timeZoneArr['Asia/Kolkata'] = 'GMT+5';
timeZoneArr['Asia/Kathmandu'] = 'GMT+5';
timeZoneArr['Antarctica/Vostok'] = 'GMT+6';
timeZoneArr['Asia/Almaty'] = 'GMT+6';
timeZoneArr['Asia/Bishkek'] = 'GMT+6';
timeZoneArr['Asia/Dhaka'] = 'GMT+6';
timeZoneArr['Asia/Omsk'] = 'GMT+6';
timeZoneArr['Asia/Qyzylorda'] = 'GMT+6';
timeZoneArr['Asia/Thimphu'] = 'GMT+6';
timeZoneArr['Asia/Urumqi'] = 'GMT+6';
timeZoneArr['Etc/GMT-6'] = 'GMT+6';
timeZoneArr['Indian/Chagos'] = 'GMT+6';
timeZoneArr['Asia/Yangon'] = 'GMT+6';
timeZoneArr['Indian/Cocos'] = 'GMT+6';
timeZoneArr['Antarctica/Davis'] = 'GMT+7';
timeZoneArr['Asia/Bangkok'] = 'GMT+7';
timeZoneArr['Asia/Barnaul'] = 'GMT+7';
timeZoneArr['Asia/Ho_Chi_Minh'] = 'GMT+7';
timeZoneArr['Asia/Hovd'] = 'GMT+7';
timeZoneArr['Asia/Jakarta'] = 'GMT+7';
timeZoneArr['Asia/Krasnoyarsk'] = 'GMT+7';
timeZoneArr['Asia/Novokuznetsk'] = 'GMT+7';
timeZoneArr['Asia/Novosibirsk'] = 'GMT+7';
timeZoneArr['Asia/Phnom_Penh'] = 'GMT+7';
timeZoneArr['Asia/Pontianak'] = 'GMT+7';
timeZoneArr['Asia/Tomsk'] = 'GMT+7';
timeZoneArr['Asia/Vientiane'] = 'GMT+7';
timeZoneArr['Etc/GMT-7'] = 'GMT+7';
timeZoneArr['Indian/Christmas'] = 'GMT+7';
timeZoneArr['Antarctica/Casey'] = 'GMT+8';
timeZoneArr['Asia/Brunei'] = 'GMT+8';
timeZoneArr['Asia/Choibalsan'] = 'GMT+8';
timeZoneArr['Asia/Hong_Kong'] = 'GMT+8';
timeZoneArr['Asia/Irkutsk'] = 'GMT+8';
timeZoneArr['Asia/Kuala_Lumpur'] = 'GMT+8';
timeZoneArr['Asia/Kuching'] = 'GMT+8';
timeZoneArr['Asia/Macau'] = 'GMT+8';
timeZoneArr['Asia/Makassar'] = 'GMT+8';
timeZoneArr['Asia/Manila'] = 'GMT+8';
timeZoneArr['Asia/Shanghai'] = 'GMT+8';
timeZoneArr['Asia/Singapore'] = 'GMT+8';
timeZoneArr['Asia/Taipei'] = 'GMT+8';
timeZoneArr['Asia/Ulaanbaatar'] = 'GMT+8';
timeZoneArr['Australia/Perth'] = 'GMT+8';
timeZoneArr['Etc/GMT-8'] = 'GMT+8';
timeZoneArr['Australia/Eucla'] = 'GMT+8';
timeZoneArr['Asia/Chita'] = 'GMT+9';
timeZoneArr['Asia/Dili'] = 'GMT+9';
timeZoneArr['Asia/Jayapura'] = 'GMT+9';
timeZoneArr['Asia/Khandyga'] = 'GMT+9';
timeZoneArr['Asia/Pyongyang'] = 'GMT+9';
timeZoneArr['Asia/Seoul'] = 'GMT+9';
timeZoneArr['Asia/Tokyo'] = 'GMT+9';
timeZoneArr['Asia/Yakutsk'] = 'GMT+9';
timeZoneArr['Etc/GMT-9'] = 'GMT+9';
timeZoneArr['Pacific/Palau'] = 'GMT+9';
timeZoneArr['Australia/Adelaide'] = 'GMT+9';
timeZoneArr['Australia/Broken_Hill'] = 'GMT+9';
timeZoneArr['Australia/Darwin'] = 'GMT+9';
timeZoneArr['Antarctica/DumontDUrville'] = 'GMT+10';
timeZoneArr['Asia/Ust-Nera'] = 'GMT+10';
timeZoneArr['Asia/Vladivostok'] = 'GMT+10';
timeZoneArr['Australia/Brisbane'] = 'GMT+10';
timeZoneArr['Australia/Currie'] = 'GMT+10';
timeZoneArr['Australia/Hobart'] = 'GMT+10';
timeZoneArr['Australia/Lindeman'] = 'GMT+10';
timeZoneArr['Australia/Melbourne'] = 'GMT+10';
timeZoneArr['Australia/Sydney'] = 'GMT+10';
timeZoneArr['Etc/GMT-10'] = 'GMT+10';
timeZoneArr['Pacific/Chuuk'] = 'GMT+10';
timeZoneArr['Pacific/Guam'] = 'GMT+10';
timeZoneArr['Pacific/Port_Moresby'] = 'GMT+10';
timeZoneArr['Pacific/Saipan'] = 'GMT+10';
timeZoneArr['Australia/Lord_Howe'] = 'GMT+10';
timeZoneArr['Antarctica/Macquarie'] = 'GMT+11';
timeZoneArr['Asia/Magadan'] = 'GMT+11';
timeZoneArr['Asia/Sakhalin'] = 'GMT+11';
timeZoneArr['Asia/Srednekolymsk'] = 'GMT+11';
timeZoneArr['Etc/GMT-11'] = 'GMT+11';
timeZoneArr['Pacific/Bougainville'] = 'GMT+11';
timeZoneArr['Pacific/Efate'] = 'GMT+11';
timeZoneArr['Pacific/Guadalcanal'] = 'GMT+11';
timeZoneArr['Pacific/Kosrae'] = 'GMT+11';
timeZoneArr['Pacific/Norfolk'] = 'GMT+11';
timeZoneArr['Pacific/Noumea'] = 'GMT+11';
timeZoneArr['Pacific/Pohnpei'] = 'GMT+11';
timeZoneArr['Antarctica/McMurdo'] = 'GMT+12';
timeZoneArr['Asia/Anadyr'] = 'GMT+12';
timeZoneArr['Asia/Kamchatka'] = 'GMT+12';
timeZoneArr['Etc/GMT-12'] = 'GMT+12';
timeZoneArr['Pacific/Auckland'] = 'GMT+12';
timeZoneArr['Pacific/Fiji'] = 'GMT+12';
timeZoneArr['Pacific/Funafuti'] = 'GMT+12';
timeZoneArr['Pacific/Kwajalein'] = 'GMT+12';
timeZoneArr['Pacific/Majuro'] = 'GMT+12';
timeZoneArr['Pacific/Nauru'] = 'GMT+12';
timeZoneArr['Pacific/Tarawa'] = 'GMT+12';
timeZoneArr['Pacific/Wake'] = 'GMT+12';
timeZoneArr['Pacific/Wallis'] = 'GMT+12';
timeZoneArr['Pacific/Chatham'] = 'GMT+12';
timeZoneArr['Etc/GMT-13'] = 'GMT+13';
timeZoneArr['Pacific/Apia'] = 'GMT+13';
timeZoneArr['Pacific/Enderbury'] = 'GMT+13';
timeZoneArr['Pacific/Fakaofo'] = 'GMT+13';
timeZoneArr['Pacific/Tongatapu'] = 'GMT+13';
timeZoneArr['Etc/GMT-14'] = 'GMT+14';
timeZoneArr['Pacific/Kiritimati'] = 'GMT+14';
