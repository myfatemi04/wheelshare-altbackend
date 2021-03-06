import fetch from "node-fetch";
import { AuthorizationCode } from "simple-oauth2";
import prisma from "./api/prisma";
import { createUser, getUserByEmail } from "./api/users";

export const authorizationCode = new AuthorizationCode({
	client: {
		id: process.env.ION_CLIENT_ID,
		secret: process.env.ION_CLIENT_SECRET,
	},
	auth: {
		tokenHost: "https://ion.tjhsst.edu/oauth/",
		authorizePath: "https://ion.tjhsst.edu/oauth/authorize",
		tokenPath: "https://ion.tjhsst.edu/oauth/token",
	},
});

export function getAuthorizationUrl(redirectUrl: string) {
	return authorizationCode.authorizeURL({
		scope: "read",
		redirect_uri: redirectUrl,
	});
}

export interface IonProfile {
	id: string;
	ion_username: string; // eg "2022mfatemi"
	sex: string; // Capitalized
	title: null;
	display_name: string;
	short_name: string;
	// Given name
	first_name: string;
	// Middle name
	middle_name?: string;
	// Family name
	last_name: string;
	nickname?: string;
	// Internal TJ email (@tjhsst.edu)
	tj_email: string;
	// Other external personal emails
	emails: string[];
	grade: {
		number: number;
		name: string; // freshman, sophomore, junior, senior
	};
	graduation_year?: number;
	user_type: "student" | "teacher" | "";
	phones: string[]; // eg "Mobile Phone: XXXXXXXXXX", including the text "Mobile Phone"
	websites: string[];
	counselor?: {
		id: string;
		// Url to API endpoint for profile info
		url: string;
		user_type: "counselor";
		username: string;
		full_name: string;
		first_name: string;
		last_name: string;
	};
	address: string | null;
	/** DO NOT USE */
	picture: string; // URL of the profile photo of the user. Seems to give empty photos right now.
	is_eighth_admin: boolean;
	is_announcements_admin: boolean;
	is_teacher: boolean;
	is_student: boolean;
	// 8th period absences count
	absences: number;
}

export async function getIonProfile(
	code: string,
	redirectUrl: string
): Promise<IonProfile> {
	let accessToken = await authorizationCode.getToken({
		code,
		redirect_uri: redirectUrl,
		scope: "read",
	});

	const profileUrl =
		"https://ion.tjhsst.edu/api/profile?format=json&access_token=" +
		accessToken.token.access_token;

	const res = await fetch(profileUrl);
	try {
		const json = await res.json();
		return json;
	} catch (e) {
		console.error(
			"Error when converting ION response to JSON. Response code:",
			res.status
		);
		console.error("Full error message:", e);
	}
}

export async function getUserIdFromIonCode(
	code: string,
	redirectUrl: string
): Promise<number> {
	const profile = await getIonProfile(code, redirectUrl);
	const user = await getUserByEmail(profile.tj_email);

	if (user == null) {
		const id = await createUser({
			name: profile.display_name,
			email: profile.tj_email,
		});
		return id;
	} else {
		return user.id;
	}
}
