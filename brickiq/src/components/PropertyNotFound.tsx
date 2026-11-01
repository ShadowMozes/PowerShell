import { SiteHeader } from "./Brand";
import { ButtonLink, Card } from "./ui";

export function PropertyNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-20">
        <Card className="p-8 text-center">
          <h1 className="font-display text-2xl font-medium">We couldn&apos;t open this report</h1>
          <p className="mt-2 text-sm text-muted">The link may be incomplete. Reports live entirely in their link, so a truncated URL can&apos;t be restored.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <ButtonLink href="/#search">Analyse a property</ButtonLink>
            <ButtonLink href="/#demos" variant="secondary">View demos</ButtonLink>
          </div>
        </Card>
      </main>
    </>
  );
}
