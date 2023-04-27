import tracks from './tracks'
import colors from './colors'

interface race {
	id: number
	host: number
	isStarted: boolean
	track: string
	carName: string
	color: string
	maxPlayers: number
	vehicles: number[]
}

interface player {
	source: number
	raceId: number
	oldPos: coords
}

interface coords {
	x: number
	y: number
	z: number
	h: number
}

class Racing {
	private raceIdCounter: number = 1
	private races: race[] = []
	private players: player[] = []

	createRace = (source: number, args: string[]) => {
		if (this.races?.find(race => race.host == source)) return console.log('Вы уже создали гонку')
		if (args.length !== 4) return console.log('Указаны не все аргументы')
		const raceId = this.raceIdCounter++

		const host = source
		const track = args[0]
		const carName = args[1]
		const color = args[2]
		const maxPlayers = +args[3]

		if (!tracks[track]) return console.log('Указанной трассы не существует')
		if (!colors[color]) return console.log('Неверно указан цвет')
		if (maxPlayers < 2 || maxPlayers > 16) return console.log('Укажите верное количество игроков (2-16)')

		const veh = this.putInVehicle(raceId, source, GetHashKey(carName), tracks[track].startPoint, color)

		const vehicles = [veh]
		const sourcePos = GetEntityCoords(GetPlayerPed(source))
		const oldPos = {x: sourcePos[0], y: sourcePos[1], z: sourcePos[2], h: GetEntityHeading(GetPlayerPed(source))}

		this.races.push({id: raceId, host, isStarted: false, track, carName, color, maxPlayers, vehicles})
		this.players.push({source, raceId, oldPos})
	}

	raceInvite = (source: number, args: string[]) => {
		if (args.length < 1) return console.log('Используйте /raceinvite [Server Player ID]')

		const playerId: number = +args[0]
		if (playerId == source) return console.log('Вы не можете пригласить себя')
		if (this.players.find(player => player.source == playerId)) return console.log('Этот игрок уже в гонке')
		const race = this.races.find(race => race.host == source)
		if (!race) return console.log('У вас нет созданных гонок')
		// if (race.isStarted) return console.log('Гонка уже началась')
		if (this.getRacePlayersCount(race.id) == race.maxPlayers) return console.log('В гонке максимальное количество участников')

		const player = GetPlayerPed(playerId)
		if (!player) return console.log(`Игрока с ID ${playerId} нет на сервере`)

		const playerPos = GetEntityCoords(player)
		const oldPos = {x: playerPos[0], y: playerPos[1], z: playerPos[2], h: GetEntityHeading(player)}

		this.players.push({source: playerId, raceId: race.id, oldPos})

		const sourcePos = GetEntityCoords(GetPlayerPed(source))
		const randomPos = this.getRandomCoords(sourcePos, 50)
		const position = {x: randomPos.x, y: randomPos.y, z: sourcePos[2], h: 0}

		const veh = this.putInVehicle(race.id, playerId, GetHashKey(race.carName), position, race.color)
		race.vehicles.push(veh)
	}

	getRacePlayersCount = (raceId: number): number => {
		return this.players.reduce((counter, player) => (player.raceId == raceId ? counter + 1 : counter), 0) || 0
	}

	leaveRace = (source: number) => {
		let player: player = this.players.find(player => player.source == source)
		if (!player) return console.log('Вы не в гонке')
		let raceId: number = player.raceId

		this.players.forEach((pl, index) => {
			if (player == pl) this.players.splice(index, 1)
		})

		const race = this.races.find(race => race.id == raceId)

		if (race.host == source) {
			const nextHost = this.players.find(player => player.raceId == raceId)
			if (nextHost) race.host = nextHost.source
			else this.removeRace(raceId)
		} else {
			if (this.getRacePlayersCount(raceId) == 1) this.removeRace(raceId)
		}

		SetPlayerRoutingBucket(`${source}`, 0)
		FreezeEntityPosition(source, false)

		SetEntityCoords(GetPlayerPed(source), player.oldPos.x, player.oldPos.y, player.oldPos.z, true, false, true, false)
		SetEntityHeading(source, player.oldPos.h)
	}

	endRace = (source: number) => {
		const race = this.races.find(race => race.host == source)
		if (!race) return console.log('Вы не начинали гонку')
		if (race && !race.isStarted) return console.log('Гонка еще не началась')
		this.removeRace(race.id)
	}

	removeRace = (raceId: number) => {
		this.races.find((race, index) => {
			if (race.id == raceId) {
				race.vehicles.forEach(veh => DeleteEntity(veh))
				this.races.splice(index, 1)
			}
		})
		this.players.forEach((player, index) => (player.raceId == raceId ? this.players.splice(index, 1) : false))
	}

	putInVehicle = (raceId: number, source: number, hash: number, pos: coords, color: string) => {
		SetPlayerRoutingBucket(`${source}`, raceId)
		SetEntityCoords(source, pos.x, pos.y, pos.z, true, false, true, false)

		const veh = CreateVehicle(hash, pos.x, pos.y, pos.z, pos.h, true, true)
		const colorArr = colors[color]

		const interval = setInterval(() => {
			if (!DoesEntityExist(veh)) return
			console.log(DoesEntityExist(veh))
			SetEntityRoutingBucket(veh, raceId)
			SetVehicleCustomPrimaryColour(veh, colorArr[0], colorArr[1], colorArr[2])
			SetVehicleCustomSecondaryColour(veh, colorArr[0], colorArr[1], colorArr[2])

			SetPedIntoVehicle(source, veh, -1)
			FreezeEntityPosition(veh, true)
			clearInterval(interval)
		}, 20)
		return veh
	}

	getRandomCoords = (pos: number[], radius: number) => {
		// Generate random offsets
		const latOffset = (Math.random() * 2 - 1) * radius
		const lngOffset = (Math.random() * 2 - 1) * radius * Math.cos((latOffset * Math.PI) / 180)

		// Apply offsets to original coordinates
		const newLat = pos[0] + latOffset
		const newLng = pos[1] + lngOffset

		// Return the new coordinates
		return {
			x: newLat,
			y: newLng,
		}
	}

	startRace = (source: number) => {
		const race = this.races.find(race => race.host == source)
		if (!race) return console.log('У вас нет созданных гонок')

		if (this.getRacePlayersCount(race.id) < race.maxPlayers) return console.log('В гонке недостаточно участников')

		race.isStarted = true

		race.vehicles.forEach(veh => FreezeEntityPosition(veh, false))
	}
}

const racing = new Racing()

RegisterCommand('createrace', racing.createRace, false)

RegisterCommand('raceinvite', racing.raceInvite, false)

RegisterCommand('leaverace', racing.leaveRace, false)

RegisterCommand('startrace', racing.startRace, false)

RegisterCommand('endrace', racing.endRace, false)
