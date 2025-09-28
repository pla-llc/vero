"use server";

import { createApi } from "@/lib/hono/server";

export async function buyNow(coin: any, solAmount: string) {
	const api = await createApi();
	const res = await api.wallet.swap.execute.$post({
		json: {
			inputToken: "So11111111111111111111111111111111111111112",
			outputToken: coin.token.address,
			amount: parseFloat(solAmount) * 10 ** 9,
			slippage: 50,
		},
	});
	const result = (await res.json()) as any;
	return result;
}
