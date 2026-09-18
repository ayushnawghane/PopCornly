import type { Metadata } from "next";
import { Unbounded, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Popcornly",
  description: "Watch videos together, in sync, with friends.",
};

// JSX comments never reach the rendered HTML (stripped at compile time), so
// the direction contract has to ship as a real HTML comment node instead —
// otherwise a build audit grepping for the seed key finds nothing.
const DIRECTION_CONTRACT = `<!--
THESIS: Popcornly is a multiplayer lobby, not a streaming clone — the room
code and the people in it ARE the interface, refusing generic dark-SaaS-
with-gradient-hero.
OWN-WORLD: deep warm violet-black ground; three named accent roles (coral,
violet, emerald) cycling through avatar chips and status; Unbounded for
room codes/headlines, Hanken Grotesk for everything else; room codes render
as grouped boxed characters, a discipline raised from a scoreboard/digit-
display challenger.
STORY: a visitor sees a room code and friends' avatar chips before anything
else, understands this is "join your friends' lobby," and starts or joins a
party within seconds.
FIRST VIEWPORT: landing hero — an oversized boxed room-code motif with
avatar chips animating in around it, "Start a party" as the primary action.
FORM: Party lobby (Impeccable's Pick, chosen over the dice-assigned
late-night-broadcast-TV direction); seed key 0cf9910b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying
its provenance.
-->`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-foreground">
        <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        {children}
      </body>
    </html>
  );
}
