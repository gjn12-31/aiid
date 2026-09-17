import type { CaseSummary } from "./types";

// Only spoiler-free metadata belongs in this module; it may be sent to browsers.
export const catalog: CaseSummary[] = [
  {
    id: "monopoly",
    number: "001",
    title: "The Bankrupt Driver",
    subtitle: "A tiny detail. A very expensive stay.",
    category: "A twist of logic",
    difficulty: "Gentle",
    minutes: "5-8 min",
    surface:
      "A man pushes his car to a hotel and announces that he is bankrupt. The owner smiles. Nobody calls the police.",
    opening:
      "An ordinary car. An ordinary hotel. Or so it seems. Ask me one yes-or-no question at a time.",
  },
  {
    id: "candles",
    number: "002",
    title: "The Countdown Cakes",
    subtitle: "One less candle. One year closer.",
    category: "Human stories",
    difficulty: "Curious",
    minutes: "8-12 min",
    surface:
      "Every year on her birthday, a girl receives a cake with no sender named on the box. Each cake has one fewer candle than the last. This year it has no candles at all, and she cries with joy.",
    opening:
      "Something is missing from this birthday cake. Start with a question, and we will follow the evidence.",
  },
  {
    id: "pilot",
    number: "003",
    title: "The Pilot's Smile",
    subtitle: "Two hundred lives. One familiar face.",
    category: "Hidden identities",
    difficulty: "Intricate",
    minutes: "12-18 min",
    surface:
      "A man calmly lands a passenger plane. All 200 people aboard survive, and the passengers applaud him. At the gate, the police are waiting for him. He smiles.",
    opening:
      "A safe landing should be the end of the story. Here, it is the beginning. What would you like to know?",
  },
];
export function publicCase(id: string) {
  return catalog.find((c) => c.id === id);
}
