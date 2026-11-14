import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <-- Añade esta línea para que se genere la carpeta 'out' al compilar
};

export default nextConfig;