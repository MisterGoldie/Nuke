"use client";

import { useEffect, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";

interface ExtendedFrameContext extends FrameContext {
  fid?: string;
}

const USERNAME_QUERY = `
  query ($fid: String!) {
    Socials(input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: $fid}}, blockchain: ethereum}) {
      Social {
        profileName
      }
    }
  }
`;

async function fetchUsername(fid: number | string): Promise<string> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_AIRSTACK_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.NEXT_PUBLIC_AIRSTACK_API_KEY!,
      },
      body: JSON.stringify({
        query: USERNAME_QUERY,
        variables: { fid: fid.toString() },
      }),
    });
    const data = await response.json();
    return data?.data?.Socials?.Social?.[0]?.profileName || "Your";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Your";
  }
}

export function useFarcasterUser() {
  const [context, setContext] = useState<ExtendedFrameContext | null>(null);
  const [username, setUsername] = useState("Your");
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    if (!sdk || isSDKLoaded) return;

    const load = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        const fid = ctx?.user?.fid;
        if (fid) {
          setUsername(await fetchUsername(fid));
        }
        await sdk.actions.ready();
      } catch (err) {
        console.error("SDK Error:", err);
        setUsername("Your");
      }
    };

    setIsSDKLoaded(true);
    void load();
  }, [isSDKLoaded]);

  return { context, username };
}
