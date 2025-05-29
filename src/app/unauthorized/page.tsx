import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* GIF */}
        <div className="flex justify-center">
          <img
            src="https://i.pinimg.com/originals/94/d6/66/94d6668cb38b312395c40c0e77be5566.gif"
            alt="Unauthorized access animation"
            className="w-48 h-48 rounded-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Tá perdido meu parceiro?
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg">
          {
            "Infelizmente essa página só pode ser acessado pelo administrativo. Pode voltar pra página principal aí."
          }
        </p>

        {/* Button to home */}
        <Button asChild className="w-full">
          <Link href="/">Voltar</Link>
        </Button>
      </div>
    </div>
  );
}
