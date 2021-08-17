const userPreviewQuerySelector = {
	select: {
		id: true,
		name: true,
	},
} as const;

export const signupsQuerySelector = {
	select: {
		latitude: true,
		longitude: true,
		placeId: true,
		formattedAddress: true,
		canDrive: true,
		note: true,
		user: userPreviewQuerySelector,
	},
} as const;

export const carpoolsQuerySelector = {
	select: {
		id: true,
		name: true,
		members: userPreviewQuerySelector,
		creatorId: true,
		note: true,
	},
} as const;

export const detailedEventsQuerySelector = {
	select: {
		id: true,
		name: true,
		group: true,
		creator: userPreviewQuerySelector,
		startTime: true,
		duration: true,
		endTime: true,
		daysOfWeek: true,
		placeId: true,
		formattedAddress: true,
		latitude: true,
		longitude: true,
		description: true,
		signups: signupsQuerySelector,
		carpools: carpoolsQuerySelector,
	},
} as const;
