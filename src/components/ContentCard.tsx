"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import UnsafeImage from "./UnsafeImage";
import { cn } from "@/lib/utils";
import { GiKatana, GiCrossedSwords } from "react-icons/gi";
import { FaCross, FaGem, FaMask, FaChevronDown } from "react-icons/fa";
import { RiSwordFill } from "react-icons/ri";
import { IoMdFlame } from "react-icons/io";

interface ContentCardProps {
  id: string;
  title: string;
  image: string;
  description: string;
  faction?: "Shinigamis" | "Quincys" | "Hollows" | "Fullbringers";
}

const factionStyles = {
  Shinigamis: {
    bg: "bg-gradient-to-br from-gray-900 via-blue-900/30 to-gray-900",
    border: "border-blue-800/60",
    hover:
      "hover:border-blue-500/80 hover:shadow-[0_0_25px_rgba(30,58,138,0.5)]",
    text: "text-gray-100",
    accent: "text-blue-400",
    icon: <RiSwordFill className="text-blue-400 text-xl" />,
    iconBg: "bg-blue-900/60 border-blue-600/50",
    glow: "shadow-[0_0_15px_rgba(30,58,138,0.5)]",
    trigger: "hover:bg-blue-900/30 data-[state=open]:bg-blue-900/40",
    header: "bg-gradient-to-r from-blue-900/80 to-blue-900/50",
    content: "bg-gradient-to-b from-blue-900/20 to-blue-900/10",
    divider: "bg-gradient-to-r from-blue-900/0 via-blue-500/50 to-blue-900/0",
  },
  Quincys: {
    bg: "bg-gradient-to-br from-gray-900/80 via-blue-900/20 to-gray-900",
    border: "border-blue-400/60",
    hover:
      "hover:border-blue-300/80 hover:shadow-[0_0_25px_rgba(96,165,250,0.4)]",
    text: "text-blue-100",
    accent: "text-blue-300",
    icon: <FaCross className="text-blue-200 text-lg" />,
    iconBg: "bg-blue-800/60 border-blue-400/50",
    glow: "shadow-[0_0_15px_rgba(96,165,250,0.4)]",
    trigger: "hover:bg-blue-800/30 data-[state=open]:bg-blue-800/40",
    header: "bg-gradient-to-r from-blue-800/80 to-blue-800/50",
    content: "bg-gradient-to-b from-blue-800/20 to-blue-800/10",
    divider: "bg-gradient-to-r from-blue-800/0 via-blue-400/50 to-blue-800/0",
  },
  Hollows: {
    bg: "bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900",
    border: "border-purple-700/60",
    hover:
      "hover:border-purple-500/80 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]",
    text: "text-purple-100",
    accent: "text-purple-400",
    icon: <FaMask className="text-purple-300 text-lg" />,
    iconBg: "bg-purple-900/60 border-purple-600/50",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    trigger: "hover:bg-purple-900/30 data-[state=open]:bg-purple-900/40",
    header: "bg-gradient-to-r from-purple-900/80 to-purple-900/50",
    content: "bg-gradient-to-b from-purple-900/20 to-purple-900/10",
    divider:
      "bg-gradient-to-r from-purple-900/0 via-purple-500/50 to-purple-900/0",
  },
  Fullbringers: {
    bg: "bg-gradient-to-br from-gray-900 via-teal-900/30 to-gray-900",
    border: "border-teal-600/60",
    hover:
      "hover:border-teal-400/80 hover:shadow-[0_0_25px_rgba(20,184,166,0.4)]",
    text: "text-teal-100",
    accent: "text-teal-300",
    icon: <FaGem className="text-teal-300 text-lg" />,
    iconBg: "bg-teal-800/60 border-teal-500/50",
    glow: "shadow-[0_0_15px_rgba(20,184,166,0.4)]",
    trigger: "hover:bg-teal-800/30 data-[state=open]:bg-teal-800/40",
    header: "bg-gradient-to-r from-teal-800/80 to-teal-800/50",
    content: "bg-gradient-to-b from-teal-800/20 to-teal-800/10",
    divider: "bg-gradient-to-r from-teal-800/0 via-teal-400/50 to-teal-800/0",
  },
  default: {
    bg: "bg-gradient-to-br from-gray-900 via-gray-800/20 to-gray-900",
    border: "border-gray-700/60",
    hover:
      "hover:border-gray-500/80 hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]",
    text: "text-gray-200",
    accent: "text-gray-300",
    icon: <GiCrossedSwords className="text-gray-300 text-lg" />,
    iconBg: "bg-gray-800/60 border-gray-600/50",
    glow: "shadow-[0_0_10px_rgba(156,163,175,0.3)]",
    trigger: "hover:bg-gray-800/30 data-[state=open]:bg-gray-800/40",
    header: "bg-gradient-to-r from-gray-800/80 to-gray-800/50",
    content: "bg-gradient-to-b from-gray-800/20 to-gray-800/10",
    divider: "bg-gradient-to-r from-gray-800/0 via-gray-500/50 to-gray-800/0",
  },
};

interface GroupedContentCardProps {
  categoria: string;
  items: ContentCardProps[];
  icon?: React.ReactNode;
}

export function GroupedContentCard({
  categoria,
  items,
  icon,
}: GroupedContentCardProps) {
  const factionKey = categoria.replace(/s$/, "") as keyof typeof factionStyles;
  const style = factionStyles[factionKey] || factionStyles.default;

  return (
    <div
      className={cn(
        "border rounded-xl shadow-lg transition-all duration-500 group relative overflow-hidden mb-10",
        style.bg,
        style.border,
        style.glow,
        style.hover
      )}
    >
      {/* Efeitos decorativos */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full filter blur-xl opacity-20 animate-pulse-slower"></div>
      </div>

      {/* Cabeçalho da categoria */}
      <div
        className={cn(
          "p-5 border-b relative overflow-hidden",
          style.header,
          style.border
        )}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-geometric.png')]"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center border shadow-md",
              style.iconBg
            )}
          >
            {icon || style.icon}
          </div>
          <h2
            className={cn(
              "text-2xl font-bold tracking-wide flex-1",
              style.accent
            )}
          >
            {categoria}
          </h2>
          <span className="text-xs font-mono uppercase tracking-widest opacity-70">
            {items.length} sistemas
          </span>
        </div>
      </div>

      <Accordion type="multiple" className="w-full">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border-none group/item"
          >
            {/* Divisor estilizado */}
            <div className={cn("h-px w-full", style.divider)}></div>

            <AccordionTrigger
              className={cn(
                "p-6 hover:no-underline w-full text-left transition-all duration-300 group-hover/item:bg-white/5",
                style.trigger,
                style.text
              )}
            >
              <div className="flex flex-col md:flex-row gap-6 w-full items-start">
                {/* Imagem com efeito hover */}
                <div className="md:w-1/4 relative min-h-[120px] overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10 opacity-70 group-hover/item:opacity-50 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-black/30 z-10 group-hover/item:bg-black/20 transition-all duration-300"></div>
                  <UnsafeImage
                    src={item.image}
                    alt={item.title}
                    width={300}
                    height={200}
                    className="w-full h-full object-cover inset-0 group-hover/item:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/70 backdrop-blur-sm">
                      {item.title || categoria}
                    </span>
                  </div>
                </div>

                {/* Ícone de acordeão personalizado */}
                <div className="ml-auto hidden md:block">
                  <FaChevronDown className="text-lg opacity-70 transition-transform duration-300 group-data-[state=open]/item:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent
              className={cn("px-6 pb-6 pt-0 relative", style.content)}
            >
              {/* Efeito de fundo do conteúdo */}
              <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

              <div className="prose prose-invert max-w-none relative z-10">
                {item.description.split("\n").map((paragraph, i) => (
                  <p key={i} className="mb-4 last:mb-0 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Imagem expandida */}
              <div className="mt-6 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                <UnsafeImage
                  src={item.image}
                  alt={item.title}
                  width={800}
                  height={450}
                  className="w-full h-auto max-h-80 object-cover"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
