export const signupsQuerySelector = {
	select: {
		latitude: true,
		longitude: true,
		placeId: true,
		formattedAddress: true,
		canDrive: true,
		user: {
			select: {
				id: true,
				name: true,
			},
		},
	},
} as const;

export const carpoolsQuerySelector = {
	select: {
		id: true,
		name: true,
		members: {
			select: {
				id: true,
				name: true,
			},
		},
	},
} as const;

export const detailedEventsQuerySelector = {
	select: {
		id: true,
		name: true,
		group: true,
		startTime: true,
		duration: true,
		endTime: true,
		daysOfWeek: true,
		placeId: true,
		formattedAddress: true,
		latitude: true,
		longitude: true,
		signups: signupsQuerySelector,
		carpools: carpoolsQuerySelector,
	},
} as const;
