import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import RecipeDetailContainer from "./RecipeDetailContainer";

export default async function RecipeDetailPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    return <RecipeDetailContainer />;
}
