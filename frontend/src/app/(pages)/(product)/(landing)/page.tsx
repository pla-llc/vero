import LandingBackground from "@/components/landing/background";
import Hero from "@/components/landing/hero";
import { useAuthState } from "@/hooks/use-auth-state";

export default async function Home() {
	const { signedIn } = await useAuthState();
	
	return (
		<main className="relative flex min-h-screen w-screen flex-col items-center pt-24">
			<LandingBackground />
			<Hero signedIn={signedIn} />
		</main>
	);
}
