import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between">
        <h1 className="text-5xl max-[500px]:text-2xl">Home Page</h1>
      </main>
    );
  } else {
    redirect("/detect");
  }
}
