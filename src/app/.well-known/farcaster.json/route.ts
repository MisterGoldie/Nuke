export async function GET() {
  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjEwOTkxNzksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg5YmEyMjgwNmNEOEY2NTEzMUU1YWQwMEUwMTdGQjhCMUFlM0EyZmFBIn0",
      payload: "eyJkb21haW4iOiJudWtlLXBvZHBsYXkudmVyY2VsLmFwcCJ9",
      signature: "MHhlMjQzMjFiMGVhNWM1NzBlZmI4YTA1ZjU2NGE2ZGExNjAyZjQ3MWE3ZDU5MjhhODM0NjdmZWE2ODdjMTA2MGNjNmI3NzcxNmVhMjI0M2YwYjlkMzU5YTk3YjgyMmFkOGE2ZTIzMGFiYjg0OGNlNTU5MGIzYTA5ODZjMTc3NTVmMzFi"
    },
    frame: {
      version: "1",
      name: "Nuke",
      iconUrl: "https://nuke-podplay.vercel.app/icon.png",
      homeUrl: "https://nuke-podplay.vercel.app",
      imageUrl: "https://nuke-podplay.vercel.app/image.png",
      buttonTitle: "Play Now",
      splashImageUrl: "https://nuke-podplay.vercel.app/splash.png",
      splashBackgroundColor: "#000000",
      webhookUrl: "https://nuke-podplay.vercel.app/api/webhook"
    }
  };

  return Response.json(config);
}
//