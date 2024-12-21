const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const AIRSTACK_API_KEY = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY;

type UserData = {
  username: string;
  pfp: string;
};

async function getAirstackProfileImage(fid: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.airstack.xyz/gql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AIRSTACK_API_KEY || '',
      },
      body: JSON.stringify({
        query: `
          query GetUserProfilePicture {
            Socials(
              input: {
                filter: {
                  userId: {_eq: "${fid}"},
                  dappName: {_eq: "farcaster"}
                },
                blockchain: ethereum
              }
            ) {
              Social {
                profileImage
              }
            }
          }
        `
      }),
    });

    const data = await response.json();
    return data?.data?.Socials?.Social?.[0]?.profileImage || null;
  } catch (error) {
    console.error('Error fetching Airstack profile image:', error);
    return null;
  }
}

export async function fetchUserDataByFid(fid: string): Promise<UserData | null> {
  try {
    console.log(`Fetching user data for FID: ${fid}`);
    const neynarResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: 'application/json',
          api_key: NEYNAR_API_KEY || '',
        },
      }
    );

    const neynarData = await neynarResponse.json();
    console.log(`Neynar response for FID ${fid}:`, neynarData);

    if (!neynarData.users?.[0]) {
      console.log(`No user data found for FID ${fid}`);
      return null;
    }

    const profileImage = await getAirstackProfileImage(fid);
    console.log(`Profile image for FID ${fid}:`, profileImage);

    return {
      username: neynarData.users[0].username,
      pfp: profileImage || '/default-avatar.png',
    };
  } catch (error) {
    console.error(`Error fetching user data for FID ${fid}:`, error);
    return null;
  }
} 