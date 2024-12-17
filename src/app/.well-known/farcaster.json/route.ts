export async function GET() {
  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjc0NzIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgzRjE2ODZlNEI1Yjg2NjdEQzY1RTMzQzMxZDVBYTg2NzcxNzhGZDRBIn0",
      payload: "eyJkb21haW4iOiJudWtlLXBvZHBsYXkudmVyY2VsLmFwcCJ9",
      signature: "MHhiZmFkMjEzY2IyNjMyODA2NDZmZjIxZWQ5YWUzY2ZiMjk0NzI0MTg0NzZiNTdkMmM2OWJmZWJhMzdkZWZmNThjMjRjYThlZGFjYzdmZmVkYmNkZmFjNWFkZjhlZjYyOTk1ZTdiMDFmODljYzlkMWRjZDlhMjRiOTcxNTliNDU3YTFj"
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
////