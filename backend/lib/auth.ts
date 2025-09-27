import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import prisma from "./prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	trustedOrigins: ["http://localhost:3000"],
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			// Listen for any successful authentication that creates a new session
			const newSession = ctx.context.newSession;
			if (newSession) {
				console.log(
					`🔍 New session created for user ${newSession.user.id} on path: ${ctx.path}`
				);

				try {
					const { WalletService } = await import("./wallet");

					const existingWallet = await WalletService.getWalletForUser(
						newSession.user.id
					);

					if (!existingWallet) {
						console.log(
							`🆕 Creating wallet for new user: ${newSession.user.id}`
						);
						const result = await WalletService.createAndFundWallet(
							newSession.user.id
						);
						if (result.funded) {
							console.log(
								`✅ Created and funded Solana wallet: ${result.publicKey}`
							);
						} else {
							console.log(
								`⚠️ Created wallet but auto-funding failed: ${result.publicKey}`
							);
						}
					} else {
						console.log(
							`🔄 Existing user logged in: ${newSession.user.id}`
						);
					}
				} catch (error) {
					console.error("Failed to handle wallet for user:", error);
				}
			}
		}),
	},
});
