// components/UnsafeImage.tsx
"use client";

import Image, { ImageProps } from "next/image";

const customLoader = ({ src }: { src: string }) => src;

export default function UnsafeImage(props: ImageProps) {
  return <Image {...props} loader={customLoader} unoptimized />;
}
