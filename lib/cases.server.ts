import "server-only";
import type { CaseId } from "./types";
export type Fact = { id: string; statement: string };
export type CaseSecret = {
  version: number;
  facts: Fact[];
  required: string[];
  hints: string[];
  timeline: string[];
  insight: string;
  counterexamples: string[];
};
export const caseSecrets: Record<CaseId, CaseSecret> = {
  monopoly: {
    version: 1,
    facts: [
      {
        id: "game",
        statement:
          "The event happens during a game of Monopoly, not an actual journey or real bankruptcy.",
      },
      {
        id: "car",
        statement:
          "The car is the player's small game token, moved by hand across the board.",
      },
      {
        id: "rent",
        statement:
          "He lands on another player's hotel property and owes more rent than his remaining play money.",
      },
      {
        id: "owner",
        statement:
          "The hotel owner is another player who is pleased to win the game money.",
      },
    ],
    required: ["game", "car", "rent", "owner"],
    hints: [
      "Check an assumption: how large are the objects in this scene?",
      "The car and the hotel both fit on a table.",
      "Think of a board game in which landing on a hotel can cost a fortune.",
    ],
    timeline: [
      "Friends sit down to play Monopoly.",
      "One player moves his car-shaped token onto an opponent's hotel property.",
      "The rent exceeds his remaining play money, so he declares bankruptcy.",
      "The other player smiles. It has all happened inside a board game.",
    ],
    insight:
      "The words car, hotel, and bankruptcy made you imagine a real street. The missing piece was the scale of the scene.",
    counterexamples: [
      "They are not playing chess, poker, or a video game.",
      "No real car breaks down. No real crime or injury occurs.",
    ],
  },
  candles: {
    version: 1,
    facts: [
      {
        id: "countdown",
        statement:
          "The candles count the years remaining until a future event, not the girl's age.",
      },
      {
        id: "father",
        statement:
          "Her living father arranges the cakes while he is in prison; there is no sender name on the box.",
      },
      {
        id: "tradition",
        statement:
          "Father and daughter previously agreed that each candle represents one year until his release.",
      },
      {
        id: "release",
        statement:
          "Zero candles means his release has arrived and he is coming home. She cries because she is happy about their reunion.",
      },
    ],
    required: ["countdown", "father", "release"],
    hints: [
      "A birthday is a way to mark time. Must the candles represent age?",
      "The number counts down to a reunion.",
      "Her father is alive but cannot come home until his prison sentence ends.",
    ],
    timeline: [
      "Before their separation, a father and daughter agree on a birthday tradition.",
      "While in prison, he sends a cake each year with one candle for every year left until release.",
      "This year, the countdown reaches zero.",
      "She cries with joy: her father is finally coming home.",
    ],
    insight:
      "Birthday candles usually count years lived. These candles counted years left to wait.",
    counterexamples: [
      "Her father is not dead, hospitalized, abroad, or serving in the army.",
      "The girl is not happy because somebody has died.",
      "The precise offense, sentence length, cake flavor, and girl's age are unspecified and irrelevant.",
    ],
  },
  pilot: {
    version: 1,
    facts: [
      {
        id: "passenger",
        statement:
          "The man is a passenger on this flight, not a scheduled member of its crew.",
      },
      {
        id: "trained",
        statement: "He is a former professional pilot and knows how to fly.",
      },
      {
        id: "emergency",
        statement:
          "Both assigned pilots become incapacitated by food poisoning from the same meal.",
      },
      {
        id: "fugitive",
        statement:
          "The man is a fugitive wanted for an earlier nonviolent financial fraud, traveling under a false name.",
      },
      {
        id: "identity",
        statement:
          "He gives his real identity while coordinating the emergency landing with air traffic control; this reveals his outstanding warrant.",
      },
      {
        id: "choice",
        statement:
          "He knowingly gives up his freedom to save the passengers, and smiles with relief that everyone survived and his life on the run is over.",
      },
    ],
    required: [
      "passenger",
      "trained",
      "emergency",
      "fugitive",
      "identity",
      "choice",
    ],
    hints: [
      "Did the person who landed the plane board it as a member of the crew?",
      "His flying skills belong to his past. So does the reason the police want him.",
      "Landing required contact with air traffic control. He chose to reveal who he really was.",
    ],
    timeline: [
      "A fugitive and former pilot boards a flight using a false identity.",
      "Both assigned pilots become ill, and he volunteers to take control.",
      "He identifies himself to air traffic control, knowing this will expose him.",
      "He lands safely and accepts the arrest, relieved that everyone is alive and he can stop running.",
    ],
    insight:
      "The rescue and the arrest have different causes. His smile comes from a deliberate choice between freedom and other people's lives.",
    counterexamples: [
      "He does not hijack or sabotage the flight.",
      "No mechanical failure causes the emergency.",
      "The arrest concerns past fraud, not wrongdoing during the rescue.",
    ],
  },
};
