import "dotenv/config";

const requiredEnvironmentVariables = [
	"GOOGLE_API_KEY",
	"ION_CLIENT_ID",
	"ION_CLIENT_SECRET",
];

for (let env of requiredEnvironmentVariables) {
	if (!(env in process.env)) {
		console.error(`FATAL: Required environment variable ${env} was not found`);
		process.exit(1);
	}
}
