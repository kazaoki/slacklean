#!/usr/bin/env node

'use strict'

const option = require('optimist')
const curl = require('curl')
const inquirer = require('inquirer')
const rp = require('request-promise');

/**
 * show vesion
 */
if(option.argv.v) {
	let json = require('./node_modules');
	console.log(`${json.name} ver ${json.version}`)
	process.exit()
}

/**
 * command args
 */
let argv = option
	.usage('Usage: slacklean [Options]')
	.demand(['token'])
	.options('token', {
		alias: 't',
		describe: 'Lagacy token: https://api.slack.com/custom-integrations/legacy-tokens',
	})
	.options('channel', {
		alias: 'c',
		describe: 'Channel name (not channel id !)'
	})
	.options('not-delete-files', {
		alias: 'n',
		boolean: true,
		default: false,
		describe: 'Not delete files.'
	})
	.options('version', {
		alias: 'v',
		describe: 'Show version'
	})
	.options('help', {
		alias: 'h',
		describe: 'Show help (this)'
	})
	.argv
;

/**
 * show help
 */
if(option.argv.h) {
	option.showHelp()
	process.exit()
}

/**
 * start
 */
(async()=>{

	let channels;
	let channel_name;
	let channel_id;

	/**
	 * get channels
	 */
	try {
		let options = {
			uri: 'https://slack.com/api/conversations.list',
			qs: {
				token: argv.token,
				types: 'public_channel,private_channel',
				limit: 9999
			},
			headers: {
				'User-Agent': 'Request-Promise'
			},
			json: true
		};
		channels = await new Promise((resolve, reject)=>{
			rp(options)
				.then(json=>resolve(json.channels))
				.catch(err=>reject(err))
		})
	} catch(err){
		throw new Error(err)
	}

	/**
	 * select a channel
	 */
	if(argv.channel && argv.channel.length) {
		// from args
		channel_name = argv.channel
		for(let ch of channels) {
			if(ch.name===argv.channel) {
				channel_id=ch.id
				break
			}
		}
	} else {
		// from list
		let selected
		try {
			selected = await new Promise((resolve, reject)=>{
				let list = []
				for(let ch of channels) {
					list.push(`${ch.name} (${ch.id}) ${ch.is_archived?'archived':''}`)
				}
				inquirer.prompt([
					{
						type: 'list',
						message: 'Select a channel.',
						name: 'selected',
						pageSize: 100,
						choices: list
					}
				])
					.then(result=>resolve(result.selected))
					.catch(err=>reject(err))
			})
		} catch(err){
			throw new Error(err)
		}
		let matches = selected.match(/^([^ ]+?) \((.+?)\)/)
		if(matches) {
			channel_name = matches[1];
			channel_id = matches[2];
		} else {
			throw new Error('can\'t matching channel string.')
		}
	}
	if(!(channel_name && channel_id)) throw new Error('not found a channel.')

	/**
	 * confirm
	 */
	let go
	try {
		go = await new Promise((resolve, reject)=>{
			inquirer.prompt([
				{
					type: 'confirm',
					message: 'start ok?',
					name: 'go',
				}
			])
				.then(result=>resolve(result.go))
				.catch(err=>reject(err))
		})
	} catch(err){
		throw new Error(err)
	}
	if(!go) process.exit()

	/**
	 * message fetching
	 */
	let loop = true
	do {
		let messages
		try {
			let options = {
				uri: 'https://slack.com/api/conversations.history',
				qs: {
					token: argv.token,
					channel: channel_id,
					// limit: 10
				},
				headers: {
					'User-Agent': 'Request-Promise'
				},
				json: true
			};
			messages = await new Promise((resolve, reject)=>{
				rp(options)
					.then(json=>resolve(json.messages))
					.catch(err=>reject(err))
			})
		} catch(err){
			throw new Error(err)
		}

		/**
		 * message delete
		 */
		if(messages.length) {
			let deleted = 0
			let options = {
				uri: 'https://slack.com/api/chat.delete',
				qs: {
					token: argv.token,
					channel: channel_id,
				},
				headers: {
					'User-Agent': 'Request-Promise'
				},
				json: true
			};
			for(let mes of messages) {
				let ok
				try {
					options.qs.ts = mes.ts
					ok = await new Promise((resolve, reject)=>{
						rp(options)
							.then(json=>{
								if(json.ok) {
									process.stdout.write('.')
									setTimeout(()=>resolve(json.ok), 1000)
								} else {
									reject(json.error)
								}
							})
							.catch(err=>reject(err))
					})
				} catch(err){
					throw new Error(err)
				}
				if(ok) deleted++
			}
			console.log(` ${deleted} messages deleted.`)
		} else {
			loop = false
		}

	} while(loop)

	if(!argv.n) {

		let loop = true
		do {

			/**
			 * files fetching
			 */
			let files
			try {
				let options = {
					uri: 'https://slack.com/api/files.list',
					qs: {
						token: argv.token,
						channel: channel_id,
						// count: 999
					},
					headers: {
						'User-Agent': 'Request-Promise'
					},
					json: true
				};
				files = await new Promise((resolve, reject)=>{
					rp(options)
						.then(json=>resolve(json.files))
						.catch(err=>reject(err))
				})
			} catch(err){
				throw new Error(err)
			}

			/**
			 * files delete
			 */
			if(files.length) {
				let deleted = 0
				let options = {
					uri: 'https://slack.com/api/files.delete',
					qs: {
						token: argv.token,
					},
					headers: {
						'User-Agent': 'Request-Promise'
					},
					json: true
				};
				for(let file of files) {
					let ok
					try {
						options.qs.file = file.id
						ok = await new Promise((resolve, reject)=>{
							rp(options)
								.then(json=>{
									if(json.ok) {
										process.stdout.write('.')
										setTimeout(()=>resolve(json.ok), 1000)
									} else {
										reject(json.error)
									}
								})
								.catch(err=>reject(err))
						})
					} catch(err){
						throw new Error(err)
					}
					if(ok) deleted++
				}
				console.log(` ${deleted} files deleted.`)
			} else {
				loop = false
			}

		} while(loop)
	}

})()
