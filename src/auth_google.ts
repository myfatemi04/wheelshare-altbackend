/*
  Copyright (C) Michael Fatemi - All Rights Reserved.
  Unauthorized copying of this file via any medium is strictly prohibited.
  Proprietary and confidential.
  Written by Michael Fatemi <myfatemi04@gmail.com>, February 2021.
*/

import fetch from "node-fetch";
import { AuthorizationCode } from "simple-oauth2";
import prisma from "./api/prisma";

export interface GoogleProfile {
	id: string; // A string of digits
	email: string;
	verified_email: boolean;
	name: string; // This is the full name
	given_name: string; // In most of Europe, this is the first name, e.g. John
	family_name: string; // In most of Europe, this is the last name, e.g. Cena
	picture: string; // URL to a profile photo
	locale: "en"; // The user's preferred language
}

const tokenURL = "https://oauth2.googleapis.com/token";
const client = {
	id: process.env.GOOGLE_KEY_ID,
	secret: process.env.GOOGLE_KEY_SECRET,
};

async function getAccessToken(code: string, redirectUrl: string) {
	let response = await fetch(tokenURL, {
		body: JSON.stringify({
			code,
			grant_type: "authorization_code",
			client_id: client.id,
			client_secret: client.secret,
			redirect_uri: redirectUrl,
		}),
		method: "POST",
		headers: { "Content-Type": "application/json" },
	});

	const result = (await response.json()) as {
		access_token: string;
	};

	return result.access_token;
}

export async function getGoogleProfile(
	code: string,
	redirectUrl: string
): Promise<GoogleProfile> {
	const accessToken = await getAccessToken(code, redirectUrl);

	const profileUrl = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`;

	const res = await fetch(profileUrl, {
		headers: {
			authorization: `Bearer ${accessToken}`,
		},
	});
	try {
		return await res.json();
	} catch (e) {
		console.error(
			"Error when converting ION response to JSON. Response code:",
			res.status
		);
		console.error("Full error message:", e);
	}
}

export async function getUserIDFromGoogleCode(
	code: string,
	redirectUrl: string
): Promise<number> {
	const profile = await getGoogleProfile(code, redirectUrl);
	console.log(profile);
	console.log("Authenticated Google user with email", profile.email);
	const user = await prisma.user.findFirst({
		where: {
			email: profile.email,
		},
	});

	if (user == null) {
		const { id } = await prisma.user.create({
			select: {
				id: true,
			},
			data: {
				name: profile.name,
				email: profile.email,
			},
		});
		return id;
	} else {
		return user.id;
	}
}
