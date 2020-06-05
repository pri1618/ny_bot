const Discord = require('discord.js');
const chalk = require('chalk');
const client = new Discord.Client();
const Sequelize = require('sequelize');
const { prefix, token, tips } = require('./config.json');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Resolutions = sequelize.define('reso', {
	username: {
		type: Sequelize.STRING,
		unique: false,
	},
	userID: {
		type: Sequelize.INTEGER,
		unique: true,
	},
	resolutions: Sequelize.ARRAY(Sequelize.TEXT),
	status: {
		type: Sequelize.ARRAY(Sequelize.TEXT),
	},
	reserve_1: Sequelize.INTEGER,
	reserve_2: Sequelize.STRING,
	reserve_3: Sequelize.STRING,
});

client.once('ready', () => {
	console.log(chalk.green('Ready!'));
	Resolutions.sync();
});

client.on('message', async message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(' ');
	// `args` is an array with all the arguments in the message which were separated by a space.
	const command = args.shift().toLowerCase();
	// removes the command from the arguments array and appropriately amends the array.

	// const cmd_list = ['ping', 'tip'];
	//
	// if (!cmd_list.includes(command)) {
	// 	message.channel.send('Command not recognized!');
	// }

	if (command === 'ping') {
		message.channel.send('Pong!');
	}

	else if (command === 'tip') {
		// message.channel.send(`>>> ${tips[Math.floor(Math.random() * tips.length)]}`);
		message.channel.send('Rome wasn\'t built in a day. Start small and you will eventually reach there!');
	}

	else if (command === 'res') {
		const user = await Resolutions.findOne({ where: { userID: message.author.id } });
		if (!user) {
			message.channel.send('We couldn\'t find any of your resolutions. Try adding one using a!res-add.');
		}
		else {
			if (!user.reserve_2) {
				message.channel.send('You have made no resolutions so far!');
				return;
			}
			const res_list_n = user.reserve_2.split('\n');
			const res_status_n = user.reserve_3.split('\n');
			// eslint-disable-next-line
			var empt_str = '';
			// eslint-disable-next-line
			for (var i in res_list_n) {
				if (i !== 0) {
					empt_str = empt_str.concat(res_list_n[i], '\n', res_status_n[i], '\n', '\n');
				}
			}
			empt_str = empt_str.slice(3);
			const exampleEmbed = {
				color: 0x0099ff,
				title: 'Your Resolutions',
				fields: [
					{
						name: 'Resolutions: ',
						value: `${empt_str}`,
					},
				],
				timestamp: new Date(),
				footer: {
					text: 'Azure: For The New You',
					icon_url: 'https://wallpapercave.com/wp/wp4912002.jpg',
				},
			};

			message.channel.send({ embed: exampleEmbed });
		}
	}

	else if (command === 'res-add') {
		if (!args) {
			message.channel.send('Please include your resolution after the command.');
			return;
		}
		const user = await Resolutions.findOne({ where: { userID: message.author.id } });
		if (!user) {
			const user_res = await Resolutions.create({
				username: message.author.username,
				userID: message.author.id,
				reserve_2: '',
				reserve_3: '',
			});
			const res_list = user_res.reserve_2;
			const res_new = res_list.concat('\n', args.join('\xa0'));
			const res_status = user_res.reserve_3;
			await Resolutions.update({ reserve_2: res_new }, { where: { userID: message.author.id } });
			await Resolutions.update({ reserve_3: res_status + '\n' + 'Active' }, { where: { userID: message.author.id } });
			message.channel.send('Resolution Added!');
		}
		else {
			const res_list = user.reserve_2;
			const res_new = res_list.concat('\n', args.join('\xa0'));
			const res_status = user.reserve_3;
			await Resolutions.update({ reserve_2: res_new }, { where: { userID: message.author.id } });
			await Resolutions.update({ reserve_3: res_status + '\n' + 'Active' }, { where: { userID: message.author.id } });
			message.channel.send('Resolution Added!');
		}
	}

	else if (command === 'res-change') {
		const user = await Resolutions.findOne({ where: { userID: message.author.id } });
		if (!user) {
			message.channel.send('We couldn\'t find any of your resolutions. Try adding one using a!res-add.');
			return;
		}
		if (!args) {
			message.channel.send('Please include the index of the resolution along with the new status after the command.');
			return;
		}

		const index = parseInt(args[0]);
		const res_list_n = user.reserve_2.split('\n');
		const res_status_n = user.reserve_3.split('\n');

		if (index + 1 > res_list_n.length) {
			message.channel.send('Index outside range! Please enter a valid index.');
			return;
		}

		args.shift();
		res_status_n[index] = args.join('\xa0');

		const updt_status = res_status_n.join('\n');
		await Resolutions.update({ reserve_3: updt_status }, { where: { userID: message.author.id } });

		message.channel.send('Status successfully updated!');
	}

	if (command === 'res-remove') {
		const user = await Resolutions.findOne({ where: { userID: message.author.id } });
		if (!user) {
			message.channel.send('We couldn\'t find any of your resolutions. Try adding one using a!res-add.');
			return;
		}
		if (!args) {
			message.channel.send('Please include the index of the resolution after the command.');
			return;
		}

		const index = parseInt(args[0]);
		const res_list_n = user.reserve_2.split('\n');
		const res_status_n = user.reserve_3.split('\n');

		if (index + 1 > res_list_n.length) {
			message.channel.send('Index outside range! Please enter a valid index.');
			return;
		}

		res_list_n.splice(index, 1);
		res_status_n.splice(index, 1);
		await Resolutions.update({ reserve_2: res_list_n.join('\n') }, { where: { userID: message.author.id } });
		await Resolutions.update({ reserve_3: res_status_n.join('\n') }, { where: { userID: message.author.id } });

		message.channel.send('Resolution successfully removed!');
	}

});

client.on('error', console.error);

client.login(token);
