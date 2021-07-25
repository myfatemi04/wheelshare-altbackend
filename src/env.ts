import "dotenv/config";

const requiredEnvironmentVariables = [
	"GOOGLE_API_KEY",
	"ION_CLIENT_ID",
	"ION_CLIENT_SECRET",
	"SENDGRID_API_KEY",
];

for (let env of requiredEnvironmentVariables) {
	if (!(env in process.env)) {
		console.error(`FATAL: Required environment variable ${env} was not found`);
		process.exit(1);
	}
}

import mail from "@sendgrid/mail";

mail.setApiKey(process.env.SENDGRID_API_KEY);
