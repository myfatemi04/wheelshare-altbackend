import mail from "@sendgrid/mail";
import prisma from "./api/prisma";

async function sendEmail(
	recipientEmail: string,
	subject: string,
	html: string
) {
	const data: mail.MailDataRequired = {
		subject,
		html,
		to: recipientEmail,
		from: "notifications@wheelshare.app",
	};

	const [response] = await mail.send(data, false);

	return response;
}

export async function sendInvitedToCarpoolEmail(
	inviteeId: number,
	carpoolId: number
) {
	const invitee = await prisma.user.findFirst({ where: { id: inviteeId } });
	const carpool = await prisma.carpool.findFirst({ where: { id: carpoolId } });
	const inviteeEmail = invitee.email;
	const inviteeName = invitee.name;
	const carpoolName = carpool.name;

	const subject = `You've been invited to a carpool!`;
	const html = `<p>Hello ${inviteeName}, </p>
		<p>You've been invited to join the carpool <strong>${carpoolName}</strong>.</p>
		<p>You can view the carpool <a href="https://wheelshare.app/carpool/${carpoolId}">here</a>.</p>
		`;

	await sendEmail(inviteeEmail, subject, html);
}

export async function sendRequestedToJoinCarpoolEmail(
	requesterId: number,
	receiverId: number,
	carpoolId: number
) {
	const requester = await prisma.user.findFirst({ where: { id: requesterId } });
	const receiver = await prisma.user.findFirst({ where: { id: receiverId } });
	const carpool = await prisma.carpool.findFirst({ where: { id: carpoolId } });

	const subject = `${requester.name} wants to join your carpool!`;
	const html = `<p>Hello ${receiver.name}, </p>
		<p>${requester.name} wants to join your carpool <strong>${carpool.name}</strong>.</p>
		<p>You can view the carpool <a href="https://wheelshare.app/carpool/${carpoolId}">here</a>.</p>
		`;

	await sendEmail(receiver.email, subject, html);
}

// Sends an email to a user that notifies them that their request to join a carpool has been accepted.
export async function sendRequestAcceptedEmail(
	requesterId: number,
	carpoolId: number
) {
	const requester = await prisma.user.findFirst({ where: { id: requesterId } });
	const carpool = await prisma.carpool.findFirst({ where: { id: carpoolId } });

	const subject = `Your request to join ${carpool.name} has been accepted!`;
	const html = `<p>Hello ${requester.name}, </p>
		<p>Your request to join ${carpool.name} has been accepted.</p>
		<p>You can view the carpool <a href="https://wheelshare.app/carpool/${carpoolId}">here</a>.</p>
		`;

	await sendEmail(requester.email, subject, html);
}
