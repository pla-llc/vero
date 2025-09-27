import LandingBackground from "@/components/landing/background";
import Hero from "@/components/landing/hero";

export default function Home() {
	return (
		<main className="relative flex min-h-screen w-screen flex-col items-center pt-24">
			<LandingBackground />
			<Hero signedIn={false} />
		</main>
	);
}
