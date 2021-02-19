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

bot.hears('Farmacias de turno', (ctx) => {
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
				{ text: 'Farmacias de turno' }
			],
			[
				{ text: 'Listado de Farmacias' }
			]
		];
		/*listOfCommands.forEach(commandObj => {
      message += "/" + commandObj.command + "\n";
      message += "" + commandObj.description + "\n\n";
    });*/
		let message = 'Puedes realizar las siguientes acciones\n';
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
	message += 'Teléfono: ' + (farmaNode['T.E.'] != undefined ? farmaNode['T.E.'] : 'Sin Teléfono');

	ctx.reply(message);
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
	let day = date.getDate() > 9 ? date.getDate() : '0' + date.getDate();
	let month = date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
	let year = date.getFullYear();

	return day + '/' + month + '/' + year;
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
