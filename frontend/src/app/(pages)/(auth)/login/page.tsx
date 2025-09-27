import { Login } from "@/components/auth/login-form";
import { useAuthState } from "@/hooks/use-auth-state";
import { redirect } from "next/navigation";

export default async function LoginPage() {
	const { signedIn } = await useAuthState();
	
	if (signedIn) {
		redirect("/dashboard");
	}
	
	return <Login />;
}
