interface coords {
	x: number
	y: number
	z: number
	h: number
}

onNet('racingSpawnVehicle', ([raceId, hash, pos, color]) => {
	RequestModel(hash)

	const interval1 = setInterval(() => {
		if (!HasModelLoaded(hash)) return
		const veh = CreateVehicle(hash, pos.x, pos.y, pos.z, pos.h, true, true)

		const interval2 = setInterval(() => {
			if (!DoesEntityExist(veh)) return

			SetVehicleCustomPrimaryColour(veh, color[0], color[1], color[2])
			SetVehicleCustomSecondaryColour(veh, color[0], color[1], color[2])

			SetPedIntoVehicle(GetPlayerPed(-1), veh, -1)

            setTimeout(() => {
                FreezeEntityPosition(veh, true)
            }, 200);

			emitNet('racingVehicleIsSpawned', [raceId, NetworkGetNetworkIdFromEntity(veh)])
			clearInterval(interval2)
		}, 20)
		clearInterval(interval1)
	}, 20)
})
