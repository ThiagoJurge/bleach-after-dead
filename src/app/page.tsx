import { Button } from "@/components/ui/button";
import { FaWhatsapp, FaCross, FaGhost, FaStar } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { GroupedContentCard } from "@/components/ContentCard";
import supabase from "@/lib/supabaseClient";

export default async function Home() {
  const { data: historia } = await supabase
    .from("comandos")
    .select("response")
    .eq("command", "historia")
    .single();

  const { data: sistemas } = await supabase
    .from("comandos")
    .select("title, response, categoria, command")
    .neq("categoria", "Geral")
    .order("categoria")
    .order("title");

  const sistemasAgrupados = sistemas?.reduce((acc, sistema) => {
    if (!acc[sistema.categoria]) acc[sistema.categoria] = [];
    acc[sistema.categoria].push(sistema);
    return acc;
  }, {} as Record<string, typeof sistemas>);

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-800 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-green-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      <header className="h-16 shrink-0 border-b border-gray-800 px-6 sticky top-0 bg-black/80 backdrop-blur-sm z-50">
        <div className="h-full flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center">
              <FaGhost className="text-white text-xs" />
            </div>
            <h1 className="font-bold text-xl text-blue-400">
              Bleach After Dead
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {["historia", "sistemas"].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-gray-900 text-blue-400 border border-gray-800"
              >
                {section}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 max-w-6xl relative z-10">
        <div className="lg:ml-32">
          {/* WhatsApp Button */}
          <section className="mb-8">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://chat.whatsapp.com/GfS8Ly3yC1eKh7wkAKolT3"
            >
              <Button className="w-full gap-2 bg-green-700 hover:bg-green-600 text-white py-4 border border-green-800">
                <FaWhatsapp />
                Entrar no Grupo
                <FaStar className="text-yellow-300 ml-auto" />
              </Button>
            </a>
          </section>

          {/* História Section */}
          <section
            id="historia"
            className="mb-12 p-6 bg-gray-900/80 rounded-lg border border-gray-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-800 rounded flex items-center justify-center">
                <FaCross className="text-white text-sm" />
              </div>
              <h2 className="text-2xl font-bold text-blue-400">História</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {historia?.response || "Carregando história..."}
            </p>
          </section>

          {/* Sistemas Section */}
          <section id="sistemas" className="mb-12">
            <div className="grid gap-6">
              {Object.entries(sistemasAgrupados || {}).map(
                ([categoria, items]) => (
                  <GroupedContentCard
                    key={categoria}
                    categoria={categoria}
                    items={items.map((item) => ({
                      id: item.title,
                      title: item.title,
                      image: `https://urwdyafcvptlxxxfftjy.supabase.co/storage/v1/object/public/images/assets/${item.command}.jpg`,
                      description: item.response,
                      faction: item.categoria as any,
                    }))}
                  />
                )
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="py-4 border-t border-gray-800 bg-black/80 text-center text-gray-500 text-xs">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Bleach After Dead</p>
          <p className="mt-1">Baseado no universo de Bleach</p>
        </div>
      </footer>
    </div>
  );
}
