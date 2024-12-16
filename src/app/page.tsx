import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/game-board.png`,
  button: {
    title: "Play Now",
    action: {
      type: "launch_frame",
      name: "Nuke",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#9d00ff",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Nuke",
    openGraph: {
      title: "Nuke",
      description: "WAR style cardgame by @goldie and the POD team.",
      images: [
        {
          url: `${appUrl}/game-board.png`,
          width: 1200,
          height: 630,
          alt: "Nuke Game Board",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (<App />);
}